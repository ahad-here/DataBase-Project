-- Database creation
CREATE DATABASE game_store;
USE game_store;

-- Users Table
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Store hashed passwords
    role VARCHAR(10) DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Games Table
CREATE TABLE Games (
    game_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    genre VARCHAR(50),
    platform VARCHAR(50),
    stock_quantity INT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cart Table
CREATE TABLE Cart (
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    game_id INT,
    quantity INT NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES Games(game_id) ON DELETE CASCADE
);

-- Orders Table
CREATE TABLE Orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(10) DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Order_Items Table
CREATE TABLE Order_Items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    game_id INT,
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES Games(game_id) ON DELETE CASCADE
);

-- Payments Table
CREATE TABLE Payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(10) DEFAULT 'pending',
    payment_method VARCHAR(50),
    amount DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_user_email ON Users(email);
CREATE INDEX idx_game_genre ON Games(genre);
CREATE INDEX idx_order_user ON Orders(user_id);

-- Trigger to update stock quantity after order placement
DELIMITER //
CREATE TRIGGER update_stock_after_order
AFTER INSERT ON Order_Items
FOR EACH ROW
BEGIN
    UPDATE Games
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE game_id = NEW.game_id;
END //
DELIMITER ;

-- Sample Data
INSERT INTO Users (username, email, password, role) VALUES
('admin1', 'admin@gamestore.com', '$2b$10$exampleHashedPassword12345', 'admin'),
('customer1', 'customer1@gamestore.com', '$2b$10$exampleHashedPassword67890', 'customer');

INSERT INTO Games (title, description, price, genre, platform, stock_quantity) VALUES
('Cyber Odyssey', 'An action-packed RPG in a cyberpunk world.', 59.99, 'Action', 'PC,PS5', 100),
('Adventure Quest', 'Explore mystical lands in this adventure game.', 39.99, 'Adventure', 'PC,Switch', 50);

-- View for order summary
CREATE VIEW Order_Summary AS
SELECT o.order_id, u.username, o.order_date, o.total_amount, o.status, COUNT(oi.order_item_id) as item_count
FROM Orders o
JOIN Users u ON o.user_id = u.user_id
LEFT JOIN Order_Items oi ON o.order_id = oi.order_id
GROUP BY o.order_id, u.username, o.order_date, o.total_amount, o.status;