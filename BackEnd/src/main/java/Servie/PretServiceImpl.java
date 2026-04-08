package Servie;

import Dao.PretDao;
import Dao.PretDaoImpl;
import Entite.Pret;
import Entite.NiveauRisque;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

public class PretServiceImpl implements PretService {

    private PretDao pretDao = new PretDaoImpl();

    @Override
    public boolean ajouterPret(Pret pret) {
        // Calculer la mensualité avant d'ajouter
        double mensualite = calculerMensualite(
                pret.getMontantPret(),
                pret.getTauxAnnuel(),
                pret.getDuree()
        );
        pret.setMensualite(mensualite);

        // Définir les dates si le prêt est accepté
        if (pret.getStatut().name().equals("En_cours")) {
            Date aujourdhui = new Date();
            pret.setDateAccord(aujourdhui);

            // Calculer la date de fin
            Calendar calendar = Calendar.getInstance();
            calendar.setTime(aujourdhui);
            calendar.add(Calendar.MONTH, pret.getDuree());
            pret.setDateFin(calendar.getTime());
        }

        return pretDao.ajouterPret(pret);
    }

    @Override
    public boolean supprimerPret(int id) {
        return pretDao.supprimerPret(id);
    }

    @Override
    public boolean modifierPret(Pret pret) {
        // Recalculer la mensualité si les données changent
        double nouvelleMensualite = calculerMensualite(
                pret.getMontantPret(),
                pret.getTauxAnnuel(),
                pret.getDuree()
        );
        pret.setMensualite(nouvelleMensualite);

        return pretDao.modifierPret(pret);
    }

    @Override
    public Pret getPretById(int id) {
        return pretDao.getPretById(id);
    }

    @Override
    public List<Pret> getAllPrets() {
        return pretDao.getAllPrets();
    }

    @Override
    public List<Pret> getPretsByClientId(int clientId) {
        return pretDao.getPretsByClientId(clientId);
    }

    @Override
    public double calculerMensualite(double montant, double tauxAnnuel, int duree) {
        if (montant <= 0 || tauxAnnuel <= 0 || duree <= 0) {
            return 0;
        }

        double tauxMensuel = tauxAnnuel / 100 / 12;
        double mensualite = (montant * tauxMensuel) / (1 - Math.pow(1 + tauxMensuel, -duree));

        return Math.round(mensualite * 100.0) / 100.0; // Arrondir à 2 décimales
    }

    @Override
    public NiveauRisque evaluerRisquePret(Pret pret, double revenuClient) {
        if (revenuClient <= 0) {
            return NiveauRisque.Eleve;
        }

        double ratioEndettement = (pret.getMensualite() / revenuClient) * 100;

        if (ratioEndettement <= 25) {
            return NiveauRisque.Faible;
        } else if (ratioEndettement <= 35) {
            return NiveauRisque.Moyen;
        } else {
            return NiveauRisque.Eleve;
        }
    }

    @Override
    public double calculerResteAPayer(int pretId) {
        Pret pret = pretDao.getPretById(pretId);
        if (pret == null || pret.getStatut().name().equals("Refuse")) {
            return 0;
        }

        // Calcul simplifié: reste = mensualité * mois restants
        Date aujourdhui = new Date();
        if (pret.getDateFin() == null || aujourdhui.after(pret.getDateFin())) {
            return 0;
        }

        Calendar calendarFin = Calendar.getInstance();
        calendarFin.setTime(pret.getDateFin());

        Calendar calendarAujourdhui = Calendar.getInstance();
        calendarAujourdhui.setTime(aujourdhui);

        int moisRestants = 0;
        while (calendarAujourdhui.before(calendarFin)) {
            calendarAujourdhui.add(Calendar.MONTH, 1);
            moisRestants++;
        }

        return pret.getMensualite() * moisRestants;
    }

    @Override
    public List<Pret> getPretsARisque() {
        List<Pret> tousPrets = pretDao.getAllPrets();
        List<Pret> pretsRisque = new ArrayList<>();

        for (Pret pret : tousPrets) {
            if (pret.getNiveauRisque() == NiveauRisque.Eleve &&
                    pret.getStatut().name().equals("En_cours")) {
                pretsRisque.add(pret);
            }
        }

        return pretsRisque;
    }
}