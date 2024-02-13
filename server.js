const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_notes_categories_db');
const express = require('express');
const app = express();
app.use(require('morgan')('dev'));
app.use(express.json());

app.get('/api/categories', async(req, res, next)=> {
    try {
        const SQL = `
            SELECT *
            FROM categories
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } 
    catch(ex){
        next(ex); 
    }
});

app.get('/api/notes', async(req, res, next)=> {
    try {
        const SQL = `
            SELECT *
            FROM notes
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } 
    catch(ex){
        next(ex); 
    }
});

app.post('/api/notes', async(req, res, next)=> {
    try {
        const SQL = `
            INSERT INTO notes(txt, category_id, ranking)
            VALUES($1, $2, $3)
            RETURNING *
        `;
        const response = await client.query(SQL, [req.body.txt, req.body.category_id, req.body.ranking]);
        res.status(201).send(response.rows[0]);
    } 
    catch(ex){
        next(ex); 
    }
});

app.delete('/api/notes/:id', async(req, res, next)=> {
    try {
        const SQL = `
            DELETE FROM notes
            WHERE id = $1
        `;
        await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    }
    catch(ex){
        next(ex);
    }
});
app.put('/api/notes/:id', async(req, res, next)=> {
    try {
        const SQL = `
            UPDATE notes
            SET txt=$1, ranking=$2, category_id=$3, updated_at=now()
            WHERE id = $4
            RETURNING *
        `;
        const response = await client.query(SQL, [
            req.body.txt,
            req.body.ranking,
            req.body.category_id,
            req.params.id
        ]);
        res.send(response.rows[0]);
    } 
    catch(ex){
        next(ex); 
    }
});

app.use((err, req, res, next)=> {
    console.log(err);
    res.status(err.status || 500).send({ error: err.message || err});
});

const init = async()=> {
    await client.connect();
    console.log('connected to database');
    let SQL = `
        DROP TABLE IF EXISTS notes;
        DROP TABLE IF EXISTS categories;
        CREATE TABLE categories(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE
        );
        CREATE TABLE notes(
            id SERIAL PRIMARY KEY,
            txt VARCHAR(200) NOT NULL,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            ranking INTEGER DEFAULT 5 NOT NULL,
            category_id INTEGER REFERENCES categories(id) NOT NULL
        );
    `;
    await client.query(SQL);
    console.log('tables created')
    SQL = `
        INSERT INTO categories(name) VALUES('SQL');
        INSERT INTO categories(name) VALUES('Shopping');
        INSERT INTO notes(txt, category_id) VALUES('Learn SQL data types', (
        SELECT id FROM categories WHERE name='SQL'));
        INSERT INTO notes(txt, category_id) VALUES('Learn SQL queries', (
        SELECT id FROM categories WHERE name='SQL'));
        INSERT INTO notes(txt, category_id) VALUES('get milk', (
        SELECT id FROM categories WHERE name='Shopping'));
    `;
    await client.query(SQL);
    console.log('data seeded');
    const port = process.env.PORT || 3000;
    app.listen(port, ()=> console.log(`listening on port ${port}`));
    console.log(`curl localhost:8080/api/notes -X POST -d '{"txt":"A New note", "category_id":1, "ranking": 17}' -H "Content-Type:application/json"`);
    console.log(`curl localhost:8080/api/notes/1 -X PUT -d '{"txt":"Updated", "category_id":1, "ranking": 99}' -H "Content-Type:application/json"`);
    console.log(`curl localhost:8080/api/notes/1 -X DELETE`);
    
};

init();
