/* eslint-disable no-restricted-globals */
const workercode = () => {
    // 导入脚本
    self.importScripts("https://cdn.jsdelivr.net/npm/spark-md5@3.0.2/spark-md5.min.js");

    // 生成文件 hash
    self.onmessage = async function calculateHash(e) {
        const { fileChunkList } = e.data;
        const fileSpark = new self.SparkMD5.ArrayBuffer();
        let percentage = 0;
        const calHashWith = fileChunk => {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.readAsArrayBuffer(fileChunk);
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
        self.close()
    }
};
// 把脚本代码转为string
let code = workercode.toString();
code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));

const blob = new Blob([code], { type: "application/javascript" });
const workerScript = URL.createObjectURL(blob);

export default workerScript;