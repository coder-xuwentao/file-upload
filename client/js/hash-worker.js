// 导入脚本
self.importScripts("../modules/spark-md5.min.js");

// 生成文件 hash
self.onmessage = async function calculateHash (e) {
    const { fileChunkList } = e.data;
    const fileSpark = new self.SparkMD5.ArrayBuffer();
    let percentage = 0;
    const calHashWith = fileChunk => {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.readAsArrayBuffer(fileChunk.file);
            reader.onload = e => {
                fileSpark.append(e.target.result);
                percentage += 100 / fileChunkList.length;
                resolve({
                    percentage,
                    chunkHash: self.SparkMD5.ArrayBuffer.hash(e.target.result),
                })
            };
        });
    }


    for (let fileChunk of fileChunkList) {
        const result = await calHashWith(fileChunk)
        self.postMessage(result);
    }
    self.postMessage({
        percentage: 100,
        fileHash: fileSpark.end()
    });
    self.close();

};