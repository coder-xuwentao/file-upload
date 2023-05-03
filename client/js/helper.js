// 生成文件和chunk的 hash（web-worker）
export function calculateHash({ fileChunkList, onProgress }) {
    return new Promise(resolve => {
        const result = { chunkHashs: [], fileHash: '' }
        // 添加 worker 属性
        let worker = new Worker("./js/hash-worker.js");
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
    // saveAs(content, 'temp.zip'); // FileSaver.min.js 此处可测试解压文件
    return content
}