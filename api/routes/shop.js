const express = require('express');
const router = express.Router();
const pool = require('../../dbconn');
const mysql = require('mysql');


router.get("/", (req, res) => {
    let sql = "SELECT * from product";
    pool.query(sql, (error, results, fields) => {
        if (error) throw error;
        res.status(200).json(results);
    });
});

router.post("/search", (req, res) => {
    const search = req.body;
    const searchname = '%' + search.name + '%';

    let sql = "SELECT * from product WHERE product_name  LIKE ? and price BETWEEN ? AND ?";
    sql = mysql.format(sql, [searchname, search.min, search.max]);
    pool.query(sql, (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.status(200).json(results);

    });
});

router.post("/createCart", (req, res) => {
    let bodydata = req.body;
    let cart_name = bodydata.cart_name;
  
    let checkSql = "SELECT * FROM cart WHERE customer_id = ? AND cart_name = ?";
    checkSql = mysql.format(checkSql, [bodydata.customer_id, cart_name]);
  
    pool.query(checkSql, (error, results) => {
      if (error) {
        return res.status(500).json({ message: "Database error during check" });
      }
  
      if (results.length > 0) {
        return res.status(409).json({ message: "Cart name already exists" });
      }
  
      let createCart = "INSERT INTO cart (customer_id, cart_name) VALUES (?, ?)";
      createCart = mysql.format(createCart, [bodydata.customer_id, cart_name]);
  
      pool.query(createCart, (error, results) => {
        if (error) {
          return res.status(500).json({ message: "Database error during insert" });
        }
  
        if (results.affectedRows === 1) {
          return res.status(201).json({
            message: "Created cart successfully",
          });
        } else {
          return res.status(405).json({
            message: "Create cart failed",
          });
        }
      });
    });
  });
  

router.get("/cart", (req, res) => {
    let sql = "SELECT * from cart";
    pool.query(sql, (error, results,) => {
        if (error) throw error;
        res.status(200).json(results);
    });
});


router.post("/add", (req, res) => {
    const product = req.body;
    const now = new Date();

    let sql = "SELECT * FROM cart_item WHERE cart_id = ? AND product_id = ?";
    sql = mysql.format(sql, [product.cart_id, product.product_id]);

    pool.query(sql, (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Database query error' });
        }

        if (results.length > 0) {

            let currentQuantity = results[0].quantity;
            let newQuantity = currentQuantity + product.quantity;

            let updateSql = `UPDATE cart_item SET quantity = ?, updated_at = ? WHERE cart_id = ? AND product_id = ?`;
            updateSql = mysql.format(updateSql, [newQuantity, now, product.cart_id, product.product_id]);

            pool.query(updateSql, (error, results) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ error: 'Failed to update item' });
                }
                return res.status(200).json({ message: 'Item quantity updated successfully' });
            });

        } else {
            let insertSql = `
          INSERT INTO cart_item (cart_id, product_id, quantity, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)`;
            insertSql = mysql.format(insertSql, [product.cart_id, product.product_id, product.quantity, now, now]);

            pool.query(insertSql, (error, results) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ error: 'Failed to add item to cart' });
                }
                return res.status(201).json({ message: 'Item added to cart successfully' });
            });
        }
    });
});


router.post("/view", (req, res) => {
    const view = req.body;
  
    const sql = `
      SELECT
        c.cart_id,
        c.cart_name,
        ci.product_id,
        p.product_name,
        p.price,
        ci.quantity,
        (ci.quantity * p.price) AS total_price
      FROM cart c
      JOIN cart_item ci ON c.cart_id = ci.cart_id
      JOIN product p ON ci.product_id = p.product_id
      WHERE c.customer_id = ?
      ORDER BY c.cart_id
    `;
  
    pool.query(sql, [view.customer_id], (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Database query error' });
      }
  
      if (!results || results.length === 0) {
        return res.status(200).json([]);
      }
  
      //จัดกลุ่มตรงนี้ใช้ AI ช่วยครับ
      const grouped = {};
  
      results.forEach(row => {
        if (!grouped[row.cart_id]) {
          grouped[row.cart_id] = {
            cart_id: row.cart_id,
            cart_name: row.cart_name,
            items: []
          };
        }
  
        grouped[row.cart_id].items.push({
          product_id: row.product_id,
          product_name: row.product_name,
          price: row.price,
          quantity: row.quantity,
          total_price: row.total_price
        });
      });
  
      const response = Object.values(grouped);
      res.status(200).json(response);
    });
  });
  

module.exports = router;