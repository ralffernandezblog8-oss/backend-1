require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./database");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ======================
// HOME
// ======================
app.get("/", (req, res) => {
    res.json({
        message: "Animal API is running"
    });
});

// ======================
// GET ALL / SEARCH
// ======================
const getAnimals = async (req, res) => {
    try {
        const { id, numLegs } = req.query;

        let rows;

        if (id) {
            [rows] = await pool.execute(
                "SELECT * FROM animals WHERE id = ?",
                [id]
            );
        } else if (numLegs) {
            [rows] = await pool.execute(
                "SELECT * FROM animals WHERE numLegs = ?",
                [numLegs]
            );
        } else {
            [rows] = await pool.execute(
                "SELECT * FROM animals ORDER BY id ASC"
            );
        }

        res.json({
            success: true,
            animals: rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve animals"
        });
    }
};

// ======================
// GET BY ID
// ======================
const getAnimalById = async (req, res) => {
    try {

        const id = Number(req.params.id);

        const [rows] = await pool.execute(
            "SELECT * FROM animals WHERE id=?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Animal not found"
            });
        }

        res.json({
            success: true,
            animal: rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve animal"
        });

    }
};

// ======================
// ADD
// ======================
const addAnimal = async (req, res) => {

    try {

        const { name, numLegs } = req.body;

        if (!name || numLegs === undefined) {
            return res.status(400).json({
                success: false,
                message: "name and numLegs are required"
            });
        }

        const [existing] = await pool.execute(
            "SELECT id FROM animals WHERE name=?",
            [name]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Animal already exists"
            });
        }

        const [result] = await pool.execute(
            "INSERT INTO animals(name,numLegs) VALUES(?,?)",
            [name, numLegs]
        );

        res.status(201).json({
            success: true,
            message: "Animal added successfully",
            id: result.insertId
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to add animal"
        });

    }

};

// ======================
// UPDATE
// ======================
const updateAnimal = async (req, res) => {

    try {

        const id = Number(req.params.id);

        const { name, numLegs } = req.body;

        if (!name || numLegs === undefined) {
            return res.status(400).json({
                success: false,
                message: "name and numLegs are required"
            });
        }

        const [result] = await pool.execute(
            "UPDATE animals SET name=?, numLegs=? WHERE id=?",
            [name, numLegs, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Animal not found"
            });
        }

        const [rows] = await pool.execute(
            "SELECT * FROM animals WHERE id=?",
            [id]
        );

        res.json({
            success: true,
            message: "Animal updated successfully",
            animal: rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to update animal"
        });

    }

};

// ======================
// DELETE
// ======================
const deleteAnimal = async (req, res) => {

    try {

        const id = Number(req.params.id);

        const [result] = await pool.execute(
            "DELETE FROM animals WHERE id=?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Animal not found"
            });
        }

        res.json({
            success: true,
            message: "Animal deleted successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to delete animal"
        });

    }

};

// ======================
// ROUTES
// ======================
app.get("/animals", getAnimals);

app.get("/animals/:id", getAnimalById);

app.post("/animals", addAnimal);

app.put("/animals/:id", updateAnimal);

app.delete("/animals/:id", deleteAnimal);

// ======================
// START SERVER
// ======================
async function startServer() {

    try {

        const connection = await pool.getConnection();

        console.log("✅ Connected to MySQL successfully");

        connection.release();

        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });

    } catch (error) {

        console.error("❌ Unable to connect to MySQL");

        console.error(error.message);

        process.exit(1);

    }

}

startServer();