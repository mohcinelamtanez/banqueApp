package Dao;

import Config.DBConnection;
import Entite.Client;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ClientDaoImpl implements ClientDao {

    @Override
    public boolean ajouterClient(Client client) {
        try (Connection conn = DBConnection.getConnection()) {
            String query = "INSERT INTO client (Nom, Prenom, Ville, Cd_postal, Revenue) VALUES (?, ?, ?, ?, ?)";
            PreparedStatement stmt = conn.prepareStatement(query, Statement.RETURN_GENERATED_KEYS);

            stmt.setString(1, client.getNom());
            stmt.setString(2, client.getPrenom());
            stmt.setString(3, client.getVille());
            stmt.setString(4, client.getCd_postal());
            stmt.setDouble(5, client.getRevenue());

            int rowsAffected = stmt.executeUpdate();

            if (rowsAffected > 0) {
                ResultSet generatedKeys = stmt.getGeneratedKeys();
                if (generatedKeys.next()) {
                    client.setId(generatedKeys.getInt(1));
                }
                return true;
            }
            return false;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public boolean supprimerClient(int id) {
        try (Connection conn = DBConnection.getConnection()) {
            String query = "DELETE FROM client WHERE Id = ?";
            PreparedStatement stmt = conn.prepareStatement(query);
            stmt.setInt(1, id);

            return stmt.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public boolean modifierClient(Client client) {
        try (Connection conn = DBConnection.getConnection()) {
            String query = "UPDATE client SET Nom = ?, Prenom = ?, Ville = ?, Cd_postal = ?, Revenue = ? WHERE Id = ?";
            PreparedStatement stmt = conn.prepareStatement(query);

            stmt.setString(1, client.getNom());
            stmt.setString(2, client.getPrenom());
            stmt.setString(3, client.getVille());
            stmt.setString(4, client.getCd_postal());
            stmt.setDouble(5, client.getRevenue());
            stmt.setInt(6, client.getId());

            return stmt.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public Client getClientById(int id) {
        Client client = null;
        try (Connection conn = DBConnection.getConnection()) {
            String query = "SELECT * FROM client WHERE Id = ?";
            PreparedStatement stmt = conn.prepareStatement(query);
            stmt.setInt(1, id);

            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                client = new Client();
                client.setId(rs.getInt("Id"));
                client.setNom(rs.getString("Nom"));
                client.setPrenom(rs.getString("Prenom"));
                client.setVille(rs.getString("Ville"));
                client.setCd_postal(rs.getString("Cd_postal"));
                client.setRevenue(rs.getDouble("Revenue"));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return client;
    }

    @Override
    public List<Client> getAllClients() {
        List<Client> clients = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection()) {
            String query = "SELECT * FROM client ORDER BY Nom, Prenom";
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(query);

            while (rs.next()) {
                Client client = new Client();
                client.setId(rs.getInt("Id"));
                client.setNom(rs.getString("Nom"));
                client.setPrenom(rs.getString("Prenom"));
                client.setVille(rs.getString("Ville"));
                client.setCd_postal(rs.getString("Cd_postal"));
                client.setRevenue(rs.getDouble("Revenue"));
                clients.add(client);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return clients;
    }

    @Override
    public List<Client> rechercherClients(String critere) {
        List<Client> clients = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection()) {
            String query = "SELECT * FROM client WHERE Nom LIKE ? OR Prenom LIKE ? OR Ville LIKE ? OR Cd_postal LIKE ?";
            PreparedStatement stmt = conn.prepareStatement(query);

            String likeCritere = "%" + critere + "%";
            stmt.setString(1, likeCritere);
            stmt.setString(2, likeCritere);
            stmt.setString(3, likeCritere);
            stmt.setString(4, likeCritere);

            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                Client client = new Client();
                client.setId(rs.getInt("Id"));
                client.setNom(rs.getString("Nom"));
                client.setPrenom(rs.getString("Prenom"));
                client.setVille(rs.getString("Ville"));
                client.setCd_postal(rs.getString("Cd_postal"));
                client.setRevenue(rs.getDouble("Revenue"));
                clients.add(client);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return clients;
    }
}