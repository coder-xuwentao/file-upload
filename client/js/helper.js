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

export function getIndexedDBManagerForFileUpload() {
    const DATA_BASE_NAME = 'UploadFileDB'
    const STORE_NAME = 'UploadFile'
    const UNIQ_KEY = 'key'
    const UNIQ_VALUE = '1' // 只存一条数据

    let dataBase = null
    function getDataBase() {
        if (dataBase) {
            return dataBase
        }
        return new Promise(resolve => {
            const request = indexedDB.open(DATA_BASE_NAME, Date.now())
            request.onupgradeneeded = e => {
                const db = e.target.result
                const transaction = e.target.transaction
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: UNIQ_KEY })
                }
                dataBase = db
                transaction.oncomplete = () => resolve(db)
            }
            request.onsuccess = e => {
                const db = e.target.result
                resolve(db)
            }
        })
    }
    return {
        async setDataInDB(data1) {
            const dataBase = await getDataBase()
            return new Promise(resolve => {
                const request = dataBase.transaction(STORE_NAME, 'readwrite')
                    .objectStore(STORE_NAME)
                    .put({...data1, [UNIQ_KEY]: UNIQ_VALUE})
                request.onsuccess = resolve('success')
            })
        },
        async getDataInDB() {
            const dataBase = await getDataBase()
            return new Promise(resolve => {
                const request = dataBase.transaction(STORE_NAME, 'readwrite')
                    .objectStore(STORE_NAME)
                    .get(UNIQ_VALUE)
                request.onsuccess = () => resolve(request.result)
            })
        }
    }

}