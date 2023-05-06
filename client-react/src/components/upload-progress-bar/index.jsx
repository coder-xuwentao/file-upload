const UploadProgressBar = (props) => {
    const { max, value } = props

    return (
        <>
            <label>上传进度条：</label>
            <progress className="upload-btn-progress-bar"
                value={value}
                max={max}
            />
        </>
    )
}
export default UploadProgressBar;