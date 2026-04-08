package Dao;

import Config.DBConnection;
import Entite.Pret;
import Entite.TypePret;
import Entite.NiveauRisque;
import Entite.Statut;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class PretDaoImpl implements PretDao {

    @Override
    public boolean ajouterPret(Pret pret) {
        try (Connection conn = DBConnection.getConnection()) {
            String query = "INSERT INTO pret (TypePret, MontantPret, Duree, TauxAnnuel, Mensualite, " +
                    "NiveauRisque, Statut, DateAccord, DateFin, ClientId) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            PreparedStatement stmt = conn.prepareStatement(query, Statement.RETURN_GENERATED_KEYS);

            stmt.setString(1, pret.getTypePret().name());
            stmt.setDouble(2, pret.getMontantPret());
            stmt.setInt(3, pret.getDuree());
            stmt.setDouble(4, pret.getTauxAnnuel());
            stmt.setDouble(5, pret.getMensualite());
            stmt.setString(6, pret.getNiveauRisque().name());
            stmt.setString(7, pret.getStatut().name());

            if (pret.getDateAccord() != null) {
                stmt.setDate(8, new java.sql.Date(pret.getDateAccord().getTime()));
            } else {
                stmt.setNull(8, Types.DATE);
            }

            if (pret.getDateFin() != null) {
                stmt.setDate(9, new java.sql.Date(pret.getDateFin().getTime()));
            } else {
                stmt.setNull(9, Types.DATE);
            }

            stmt.setInt(10, pret.getClientId());

            int rowsAffected = stmt.executeUpdate();

            if (rowsAffected > 0) {
                ResultSet generatedKeys = stmt.getGeneratedKeys();
                if (generatedKeys.next()) {
                    pret.setId(generatedKeys.getInt(1));
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
    public boolean supprimerPret(int id) {
        try (Connection conn = DBConnection.getConnection()) {
            String query = "DELETE FROM pret WHERE Id = ?";
            PreparedStatement stmt = conn.prepareStatement(query);
            stmt.setInt(1, id);

            return stmt.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public boolean modifierPret(Pret pret) {
        try (Connection conn = DBConnection.getConnection()) {
            String query = "UPDATE pret SET TypePret = ?, MontantPret = ?, Duree = ?, TauxAnnuel = ?, " +
                    "Mensualite = ?, NiveauRisque = ?, Statut = ?, DateAccord = ?, DateFin = ?, ClientId = ? " +
                    "WHERE Id = ?";
            PreparedStatement stmt = conn.prepareStatement(query);

            stmt.setString(1, pret.getTypePret().name());
            stmt.setDouble(2, pret.getMontantPret());
            stmt.setInt(3, pret.getDuree());
            stmt.setDouble(4, pret.getTauxAnnuel());
            stmt.setDouble(5, pret.getMensualite());
            stmt.setString(6, pret.getNiveauRisque().name());
            stmt.setString(7, pret.getStatut().name());

            if (pret.getDateAccord() != null) {
                stmt.setDate(8, new java.sql.Date(pret.getDateAccord().getTime()));
            } else {
                stmt.setNull(8, Types.DATE);
            }

            if (pret.getDateFin() != null) {
                stmt.setDate(9, new java.sql.Date(pret.getDateFin().getTime()));
            } else {
                stmt.setNull(9, Types.DATE);
            }

            stmt.setInt(10, pret.getClientId());
            stmt.setInt(11, pret.getId());

            return stmt.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public Pret getPretById(int id) {
        Pret pret = null;
        try (Connection conn = DBConnection.getConnection()) {
            String query = "SELECT * FROM pret WHERE Id = ?";
            PreparedStatement stmt = conn.prepareStatement(query);
            stmt.setInt(1, id);

            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                pret = mapResultSetToPret(rs);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return pret;
    }

    @Override
    public List<Pret> getAllPrets() {
        List<Pret> prets = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection()) {
            String query = "SELECT * FROM pret ORDER BY DateAccord DESC";
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(query);

            while (rs.next()) {
                prets.add(mapResultSetToPret(rs));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return prets;
    }

    @Override
    public List<Pret> getPretsByClientId(int clientId) {
        List<Pret> prets = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection()) {
            String query = "SELECT * FROM pret WHERE ClientId = ? ORDER BY DateAccord DESC";
            PreparedStatement stmt = conn.prepareStatement(query);
            stmt.setInt(1, clientId);

            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                prets.add(mapResultSetToPret(rs));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return prets;
    }

    @Override
    public List<Pret> getPretsByStatut(String statut) {
        List<Pret> prets = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection()) {
            String query = "SELECT * FROM pret WHERE Statut = ? ORDER BY DateAccord DESC";
            PreparedStatement stmt = conn.prepareStatement(query);
            stmt.setString(1, statut);

            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                prets.add(mapResultSetToPret(rs));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return prets;
    }

    private Pret mapResultSetToPret(ResultSet rs) throws SQLException {
        Pret pret = new Pret();
        pret.setId(rs.getInt("Id"));

        String typePretStr = rs.getString("TypePret");
        if (typePretStr != null) {
            try {
                pret.setTypePret(TypePret.valueOf(typePretStr));
            } catch (IllegalArgumentException e) {
                pret.setTypePret(TypePret.Personnel);
            }
        }

        pret.setMontantPret(rs.getDouble("MontantPret"));
        pret.setDuree(rs.getInt("Duree"));
        pret.setTauxAnnuel(rs.getDouble("TauxAnnuel"));
        pret.setMensualite(rs.getDouble("Mensualite"));

        String niveauRisqueStr = rs.getString("NiveauRisque");
        if (niveauRisqueStr != null) {
            try {
                pret.setNiveauRisque(NiveauRisque.valueOf(niveauRisqueStr));
            } catch (IllegalArgumentException e) {
                pret.setNiveauRisque(NiveauRisque.Eleve);
            }
        }

        String statutStr = rs.getString("Statut");
        if (statutStr != null) {
            try {
                pret.setStatut(Statut.valueOf(statutStr));
            } catch (IllegalArgumentException e) {
                pret.setStatut(Statut.En_cours);
            }
        }

        Date dateAccord = rs.getDate("DateAccord");
        if (dateAccord != null && !rs.wasNull()) {
            pret.setDateAccord(new java.util.Date(dateAccord.getTime()));
        }

        Date dateFin = rs.getDate("DateFin");
        if (dateFin != null && !rs.wasNull()) {
            pret.setDateFin(new java.util.Date(dateFin.getTime()));
        }

        pret.setClientId(rs.getInt("ClientId"));

        return pret;
    }
}