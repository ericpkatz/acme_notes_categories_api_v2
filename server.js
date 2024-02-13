const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_notes_categories_db');

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
    
};

init();
