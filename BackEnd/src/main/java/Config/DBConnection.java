package Config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.* ;

public class DBConnection {
    private static final String url = "jdbc:mysql://localhost:3306/banqueapp?useSSL=false&serverTimezone=UTC";
    private static final String USER = "root";
    private static final String PASSWORD = "";

    // Méthode pour obtenir la connexion
    public static Connection getConnection() throws SQLException, ClassNotFoundException {
        Class.forName("com.mysql.cj.jdbc.Driver"); // Charger le driver
        return DriverManager.getConnection(url, USER, PASSWORD);
    }


}
