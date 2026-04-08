package Servie;

import Entite.Pret;
import Entite.NiveauRisque;
import java.util.List;

public interface PretService {
    boolean ajouterPret(Pret pret);
    boolean supprimerPret(int id);
    boolean modifierPret(Pret pret);
    Pret getPretById(int id);
    List<Pret> getAllPrets();
    List<Pret> getPretsByClientId(int clientId);

    // Méthodes de calcul
    double calculerMensualite(double montant, double tauxAnnuel, int duree);
    NiveauRisque evaluerRisquePret(Pret pret, double revenuClient);
    double calculerResteAPayer(int pretId);
    List<Pret> getPretsARisque();
}