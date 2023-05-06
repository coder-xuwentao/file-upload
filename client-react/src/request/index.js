import axios from 'axios'

const axiosRequest = axios.create({
    baseURL: 'http://localhost:5001/',
    timeout: 60000,
    headers: 'Content-Type:application/x-www-form-urlencoded',
});


export function noticeMerge(fileName, fileHash, sliceSize) {
    return axiosRequest({
        method: 'post',
        url: 'upload/merge',
        data: JSON.stringify({
            sliceSize,
            fileName,
            fileHash
        }),
    })
}

// 是否需要上传，如果不需要了，就是秒传
export async function getShouldUpload(fileName, fileHash) {
    const res = await axiosRequest({
        method: 'post',
        url: 'upload/verify',
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
        url: 'upload',
        data: formData,
        signal,
    })
}

export async function getCanContinue(data) {
    const result = await axiosRequest({
        method: 'post',
        url: 'upload/can_continue',
        data: JSON.stringify(data),
    })
    return result.data
}
