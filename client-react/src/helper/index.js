import JSZip from 'jszip'
import workerScript from './hash-worker';
import { getShouldUpload, uploadData, noticeMerge } from '../request'
import { SLICE_SIZE } from '../const'


// 生成文件和chunk的 hash（web-worker）
export function calculateHash({ fileChunkList, onProgress }) {
    return new Promise(resolve => {
        const result = { chunkHashs: [], fileHash: '' }
        // 添加 worker 属性
        let worker = new Worker(workerScript);
        worker.postMessage({ fileChunkList });
        worker.onmessage = e => {
            const { percentage, fileHash, chunkHash } = e.data;
            onProgress?.(percentage)
            if (fileHash) {
                result.fileHash = fileHash
                resolve(result);
            } else {
                result.chunkHashs.push(chunkHash)
            }
        }
    })
}


// 创建切片
export function createChunk(file, sliceSize) {
    const chunkList = []
    let cur = 0
    while (cur < file.size) {
        chunkList.push(file.slice(cur, cur + sliceSize))
        cur += sliceSize
    }
    return chunkList
}

export async function generateZip(file) {
    var zip = new JSZip();
    zip.file(file.name, file, { date: new Date(file.lastModifiedDate) });
    const content = await zip.generateAsync({
       type: "blob",
       compression: "DEFLATE", 
       compressionOptions: {
          level: 9
       }
    })
    // saveAs(content, 'temp.zip'); // FileSaver库 此处可测试解压文件
    return content
}


export async function uploadChunks({ fileName, hashToChunkMap, chunkHashs, fileHash, controllerRef,
    onOneChunkUploaded, onQuickUploaded
}) {
    // 是否需要上传，不需要就是妙传了。
    const canQuickUploaded = !(await getShouldUpload(fileName, fileHash))
    if (canQuickUploaded) {
        onQuickUploaded?.()
        alert('秒传成功')
        return
    }

    const requestList = chunkHashs.map((chunkHash) => {
        const formData = new FormData()
        const { chunk: file, index } = hashToChunkMap.get(chunkHash)
        formData.append('file', file)
        formData.append('fileHash', fileHash)
        formData.append('chunkName', `${chunkHash}-${index}`)
        return { formData, chunkHash }
    })
        .map(({ formData, chunkHash }) => {
            return new Promise(async (resolve, reject) => {
                try {
                    await uploadData(formData, controllerRef.current.signal)
                } catch (error) {
                    console.warn('uploadChunk fail', error)
                    controllerRef.current = new AbortController()
                    reject()
                    return
                }
                onOneChunkUploaded?.(chunkHash)
                resolve()
            })
        })
    await Promise.all(requestList) //保证所有的切片都已经传输完毕
    
    //当所有切片上传成功之后，通知后端合并
    await noticeMerge(fileName, fileHash, SLICE_SIZE)
    alert('上传成功')
}