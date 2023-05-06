import { noticeMerge, getShouldUpload, uploadChunks } from '../../request/index.js'
import { setDataInDB } from '../../helper/indexedDB.js'
import { SLICE_SIZE } from '../../const/index.js'

const UploadBtn = (props) => {
    const handleClickUpload = async () => {
        const { controllerRef, data, updateData, setUploadProgress } = props
        const { file, fileHash, chunkHashs, hashToChunkMap } = data
        const shouldUpload = await getShouldUpload(file.name, fileHash)
        if (!shouldUpload) {
            alert('秒传成功')
            return
        }
        await setDataInDB(data)
        
        await uploadChunks({
            hashToChunkMap,
            chunkHashs,
            fileHash,
            signal: controllerRef.current.signal,
            onOneChunkUploaded: () => setUploadProgress((progress) => {
                console.log(SLICE_SIZE + progress)
                return SLICE_SIZE + progress
            }),
            onComplete: (uploadedHashs) => updateData({ ...data.uploadedHashs ,uploadedHashs }),
        })
        
        //当所有切片上传成功之后，通知后端合并
        await noticeMerge(data.file.name, data.fileHash, SLICE_SIZE)
        alert('上传成功')
    }

    return (
        <div className="upload-btn">
            <button onClick={handleClickUpload}>上传</button>
        </div>
    )
}
export default UploadBtn;