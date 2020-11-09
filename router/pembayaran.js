const express = require("express")
const app = express()
const multer = require('multer')

//memanggil model
const pembayaran = require("../models/index").pembayaran
const tagihan = require("../models/index").tagihan
const penggunaan = require("../models/index").penggunaan
const pelanggan = require("../models/index").pelanggan

//middleware agar bisa mengenali request dari body
app.use(express.urlencoded({extended:true}))
const verifyAdmin = require("./auth/verifyAdmin")
const verifyUser = require("./auth/verifyUser")

//multer
const path = require("path")
const fs = require("fs")

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./image")
    },
    filename: (req, file, cb) => {
        cb(null, "img-" + Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage})

app.get("/",verifyUser,async(req,res)=>{
    //execute get
    pembayaran.findAll()
    
    res.json({
        data:data
    })
})
app.post("/",upload.single("bukti"),verifyUser , async(req,res) => {
    // insert data
    let param = {
        id_tagihan: req.body.id_tagihan
    }
    let result = await tagihan.findOne({
        where:param,
        include: [
            {
                model: penggunaan,
                as: "penggunaan",
                include: [
                    {
                        model: pelanggan,
                        as: "pelanggan",
                        include: ["tarif"]
                    }
                ]
            }
        ]
    })
    let tarifkwh = result.penggunaan.pelanggan.tarif.tarifperkwh
    let meter = result.jumlah_meter
    let biayaadmin = parseInt(req.body.biaya_admin)
    let total = meter*tarifkwh+biayaadmin

    let data = {
        id_tagihan: req.body.id_tagihan,
        bulan_bayar: req.body.bulan_bayar,
        tanggal_pembayaran: Date.now(),
        biaya_admin: req.body.biaya_admin,
        total_bayar: total,
        status: 0,
        bukti: req.file.filename,
        id_admin: req.body.id_admin
    }
    pembayaran.create(data)
        .then(result => {
            res.json({
                message: "Data has been inserted",
                data: result
            })
        })
        .catch(error => {
            res.json({
                message: error.message
            })
        })
})
app.put("/",verifyAdmin,(req,res)=>{
    let data = {
        status : req.body.status
    }
    let param = {
        id_pembayaran : req.body.id_pembayaran
    }
    
    //execute update
    pembayaran.update(data,{where:param})
    .then(result=>{
        res.json({
            message : "data has been updated",
            data: data
        })
    })
    .catch(error => {
        res.json({
            message : error.message
        })
    })
})
app.delete("/:id_pembayaran",verifyAdmin,async(req,res) =>{
    let id_pembayaran = req.params.id_pembayaran //variabel
    let param = {
        id_pembayaran : id_pembayaran
    }
    //execute delete
    pembayaran.destroy({where:param})
    .then(result=>{
        res.json({
            message : "data has been delete",
            data: result
        })
    })
    .catch(error => {
        res.json({
            message : error.message
        })
    })
})

module.exports=app