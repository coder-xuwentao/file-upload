import { getCanContinue } from '../request'
import localforage from 'localforage'

export const setDataInDB = localforage.setItem.bind(localStorage, 'file')
export const getDataInDB = localforage.getItem.bind(localStorage, 'file')
export const removeDataInDB = localforage.removeItem.bind(localStorage, 'file')

export async function initDataFromDB({ onLoadData, onConfirmToContinue }) {
    const dataInDB = await getDataInDB()
    if (!dataInDB) {
        return
    }
    delete dataInDB.key
    onLoadData?.(dataInDB)
    const { file, fileHash, chunkHashs } = dataInDB
    const result = await getCanContinue({
        fileName: file.name, fileHash, chunkHashs
    })
    const { canContinue } = result.data
    if (canContinue && window.confirm('继续上传？')) {
        onConfirmToContinue?.()
    }
}