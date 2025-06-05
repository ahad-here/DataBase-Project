DELIMITER //

-- Stored Procedure for User Login
CREATE PROCEDURE sp_LoginUser(
    IN p_email VARCHAR(100)
)
BEGIN
   
    SELECT user_id, username, email, role, password
    FROM Users
    WHERE email = p_email;
END //

-- Stored Procedure for User Registration
CREATE PROCEDURE sp_RegisterUser(
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255),
    IN p_role VARCHAR(10)
)
BEGIN
    INSERT INTO Users (username, email, password, role)
    VALUES (p_username, p_email, p_password, p_role);
    
    SELECT user_id, username, email, role
    FROM Users
    WHERE email = p_email;
END //

-- Stored Procedure to Get User Orders
CREATE PROCEDURE sp_GetUserOrders(
    IN p_user_id INT
)
BEGIN
   
    SELECT o.order_id, o.order_date, o.total_amount, o.status
    FROM Orders o
    WHERE o.user_id = p_user_id;
END //

DELIMITER ;