import axios from 'axios'

const axiosRequest = axios.create({
    baseURL: 'http://localhost:3000/',
    timeout: 60000,
    headers: 'Content-Type:application/x-www-form-urlencoded',
});


export function noticeMerge(fileName, fileHash, sliceSize) {
    return axiosRequest({
        method: 'post',
        url: 'upload/merge',//后端合并请求
        data: JSON.stringify({
            sliceSize,
            fileName,
            fileHash
        }),
    })
}

export async function getShouldUpload(fileName, fileHash) {
    const res = await axiosRequest({
        method: 'post',
        url: 'upload/verify', //请求接口，要与后端一一一对应
        data: JSON.stringify({
            fileName,
            fileHash,
        }),
    })
    return res.data.shouldUpload
}

export function uploadData(formData, signal) {
    return axiosRequest({
        method: 'post',
        url: 'upload',//请求接口，要与后端一一一对应
        data: formData,
        signal,
    })
}

export function getCanContinue(data) {
    return axiosRequest({
        method: 'post',
        url: 'upload/can_continue',//请求接口，要与后端一一一对应
        data: JSON.stringify(data),
    })
}

export async function uploadChunks({ hashToChunkMap, chunkHashs, fileHash, onChunkUploaded, signal }) {
    const requestList = chunkHashs.map((chunkHash) => {
        const formData = new FormData() // 创建表单类型数据
        const { chunk: file, index } = hashToChunkMap.get(chunkHash)
        formData.append('file', file) //该文件
        formData.append('fileHash', fileHash) //文件hash
        formData.append('chunkName', `${chunkHash}-${index}`) //切片名
        return { formData, chunkHash }
    })
        .map(({ formData, chunkHash }) => {
            return new Promise(async resolve => {
                await uploadData(formData, signal)
                onChunkUploaded?.(chunkHash)
                resolve()
            })
        })
    await Promise.all(requestList)//保证所有的切片都已经传输完毕
}