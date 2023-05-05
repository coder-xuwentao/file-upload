import { useState } from 'react'

const ContinueBtn = (props) => {
    const handleClickUpload = async () => {
        alert('上传成功')
    }

    return <button onClick={handleClickUpload}>继续</button>
}
export default ContinueBtn;