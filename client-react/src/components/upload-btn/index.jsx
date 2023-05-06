import { uploadChunks } from '../../helper'

const UploadBtn = (props) => {
    const handleClickUpload = async () => {
        const { controllerRef, dataRef, setProgressValue } = props
        const { fileName, fileHash, chunkHashs, hashToChunkMap } = dataRef.current
        
        await uploadChunks({
            fileName,
            hashToChunkMap,
            chunkHashs,
            fileHash,
            controllerRef,
            onOneChunkUploaded: () => setProgressValue(value => value + 1),
            onQuickUploaded: () => {
                setProgressValue(chunkHashs.length)
            },
        })
    }

    return (
        <div className="upload-btn">
            <button onClick={handleClickUpload}>上传</button>
        </div>
    )
}
export default UploadBtn;