module.exports = {
    crawler : (req, res) => {
        const { url } = req.body
        return  res.status(200).json({ msg: url })
    }
}