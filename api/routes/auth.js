const express = require('express');
const router = express.Router();
const pool = require('../../dbconn');
const mysql = require('mysql');
const bcrypt = require('bcrypt')

router.get('/customer', (req, res) => {
    pool.query('SELECT * from customer', (error, results, fields) => {
        if (error) throw error;
        res.status(200).json(results);
    });
});
router.post('/register', async (req, res) => {
    const data = req.body;

    try {
        // hash ผมใช้ chatgpt แนะนำให้ใช้ bcrypt
        const hashedPassword = await bcrypt.hash(data.password, 10);

        let sql = 'INSERT INTO customer (`first_name`, `last_name`, `email`, `phone_number`, `address`, `password`) VALUES (?, ?, ?, ?, ?, ?)';
        sql = mysql.format(sql, [data.first_name, data.last_name, data.email, data.phone_number, data.address, hashedPassword]);

        pool.query(sql, (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Database error' });
            }

            if (results.affectedRows == 1) {
                res.status(201).json({ message: 'Customer created successfully' });
            } else {
                res.status(500).json({ message: 'Failed to create customer' });
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Password hashing failed' });
    }
});


// router.get('/login', (req, res) => {
//     pool.query('SELECT * from customer', (error, results, fields) => {
//         if (error) throw error;
//         res.status(200).json(results);
//     });
// });

router.post('/login', (req, res) => {
    let { email, password } = req.body;

    let sql = 'SELECT * FROM customer WHERE email = ?';
        sql = mysql.format(sql, [email])
    pool.query(sql, (error, results) => {
        if (error) {
            res.status(500).json({ message: 'Database Error' });
        }

        if (results.length === 0) {
            res.status(401).json({ message: 'Email not found' });
        }

        let user = results[0];
        //ส่วนตรงนี้ถาม chatgpt ครับ T_T
       bcrypt.compare(  password, user.password,  (error, rus) => {
        if (error) {
            res.status(500).json({ message: 'Error verifying password' });
        }
        if (rus) {
            //ถ้ารหัสผ่านถูกต้องให้ส่งข้อมูลผู้ใช้กลับไปและแยก password ออกไปครับตามที่เข้าใจมานะครับ T_T
            let {password,...userData} = user
            res.status(200).json(userData);
        } else {
            res.status(401).json({
                message: 'Invalid email or password'
            });
        }
       } )
    });
});

router.post('/changepwd', async (req,res)=>{
    let { email, password, newpassword } = req.body;

    let newpass = await bcrypt.hash(newpassword, 10);

    let sql = 'SELECT * FROM customer WHERE email = ?';

        sql = mysql.format(sql, [email])
    pool.query(sql,(error,results)=>{
        if (results.length === 0) {
            res.status(401).json({ message: 'Email not found' });
        }
        if (error) {
            res.status(500).json({ message: 'Database ERROR' });
        }

        //ตรงนี้ใช้ AI ช่วยครับ T_T
        let userData = results[0];
        bcrypt.compare(password,userData.password , (err, rus) => {
            if(err){
                res.status(404);
            }

            if (rus) {
                let sql = 'UPDATE customer SET password = ? WHERE email = ?';
                sql = mysql.format(sql, [newpass, email]);

                pool.query(sql,(error,results)=>{
                    if (error) {
                        res.status(500).json({ message: 'Database error' });
                    }

                    if (results.affectedRows == 1) {
                        res.status(200).json({ message: 'Update Password' });
                    } else {
                        res.status(400).json({ message: 'Update Password  failed' });
                    }
                })
            }
            
        })
    })

})


module.exports = router;