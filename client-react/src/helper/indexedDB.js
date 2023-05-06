import { getCanContinue } from '../request'
import { uploadChunks } from './index'
import localforage from 'localforage'

export const setDataInDB = localforage.setItem.bind(localStorage, 'file')
export const getDataInDB = localforage.getItem.bind(localStorage, 'file')
export const removeDataInDB = localforage.removeItem.bind(localStorage, 'file')

export async function initDataFromDB({ onLoadData, controllerRef, setProgressValue }) {
    const dataInDB = await getDataInDB()
    if (!dataInDB) {
        return
    }
    const { fileName, fileHash, chunkHashs } = dataInDB
    const { canContinue } = await getCanContinue({
        fileName, fileHash, chunkHashs
    })
    onLoadData?.(dataInDB)
    if (canContinue && window.confirm('继续上传？')) {
        uploadChunks({
            ...dataInDB, 
            controllerRef,
            onOneChunkUploaded: () => setProgressValue(value => value + 1),
            onQuickUploaded: () => setProgressValue(chunkHashs.length),
        })
    }
}