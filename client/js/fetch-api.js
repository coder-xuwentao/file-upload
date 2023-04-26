import axios from '../modules/axios.min.js'

const axiosRequest = axios.create({
    baseURL: 'http://localhost:3000/',
    timeout: 5000,
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