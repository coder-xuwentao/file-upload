// 生成文件 hash（web-worker）
export function calculateHash({ fileChunkList, onProgress }) {
    return new Promise(resolve => {
        const result = { chunkHashs: [], fileHash: '' }
        // 添加 worker 属性
        let worker = new Worker("./js/hash-worker.js");
        worker.postMessage({ fileChunkList });
        worker.onmessage = e => {
            const { percentage, fileHash, chunkHash } = e.data;
            // console.log('进度', percentage,  fileHash, chunkHash)
            // console.log(percentage)
            onProgress(percentage)
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
export function createChunk(file, size) {
    const chunkList = []
    let cur = 0
    while (cur < file.size) {
        chunkList.push({
            file: file.slice(cur, cur + size)
        })
        cur += size
    }
    return chunkList
}