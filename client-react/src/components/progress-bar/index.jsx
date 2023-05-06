const ProgressBar = (props) => {
    const { max, value, label } = props

    return (
        <div>
            <label>{label}</label>
            <progress className="upload-btn-progress-bar"
                value={value}
                max={max}
            />
        </div>
    )
}
export default ProgressBar;