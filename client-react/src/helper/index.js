import JSZip from 'jszip'
import workerScript from './hash-worker';
import localforage from 'localforage'
// import saveAs from 'file-saver'

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


export const setDataInDB = localforage.setItem.bind(localStorage, 'file')
export const getDataInDB = localforage.getItem.bind(localStorage, 'file')
export const removeDataInDB = localforage.removeItem.bind(localStorage, 'file')