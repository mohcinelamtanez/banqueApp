package Dao;

import Entite.Pret;
import java.util.List;

public interface PretDao {
   boolean ajouterPret(Pret pret);
   boolean supprimerPret(int id);
   boolean modifierPret(Pret pret);
   Pret getPretById(int id);
   List<Pret> getAllPrets();
   List<Pret> getPretsByClientId(int clientId);
   List<Pret> getPretsByStatut(String statut);
}