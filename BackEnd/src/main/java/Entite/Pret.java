package Entite;

import java.util.Date;

public class Pret {
    private int Id;
    private TypePret typePret;
    private double MontantPret;
    private int Duree;
    private double TauxAnnuel;
    private double Mensualite;
    private NiveauRisque niveauRisque;
    private Statut statut;
    private Date DateAccord;
    private Date DateFin;
    private int ClientId;

    // Constructeurs
    public Pret() {}

    public Pret(TypePret typePret, double montantPret, int duree, double tauxAnnuel,
                int clientId) {
        this.typePret = typePret;
        this.MontantPret = montantPret;
        this.Duree = duree;
        this.TauxAnnuel = tauxAnnuel;
        this.ClientId = clientId;
        this.statut = Statut.En_cours; // Par défaut
    }

    // Getters/Setters (déjà fournis)
    public int getId() { return Id; }
    public void setId(int id) { this.Id = id; }

    public TypePret getTypePret() { return typePret; }
    public void setTypePret(TypePret typePret) { this.typePret = typePret; }

    public double getMontantPret() { return MontantPret; }
    public void setMontantPret(double montantPret) { this.MontantPret = montantPret; }

    public int getDuree() { return Duree; }
    public void setDuree(int duree) { this.Duree = duree; }

    public double getTauxAnnuel() { return TauxAnnuel; }
    public void setTauxAnnuel(double tauxAnnuel) { this.TauxAnnuel = tauxAnnuel; }

    public double getMensualite() { return Mensualite; }
    public void setMensualite(double mensualite) { this.Mensualite = mensualite; }

    public NiveauRisque getNiveauRisque() { return niveauRisque; }
    public void setNiveauRisque(NiveauRisque niveauRisque) { this.niveauRisque = niveauRisque; }

    public Statut getStatut() { return statut; }
    public void setStatut(Statut statut) { this.statut = statut; }

    public Date getDateAccord() { return DateAccord; }
    public void setDateAccord(Date dateAccord) { this.DateAccord = dateAccord; }

    public Date getDateFin() { return DateFin; }
    public void setDateFin(Date dateFin) { this.DateFin = dateFin; }

    public int getClientId() { return ClientId; }
    public void setClientId(int clientId) { this.ClientId = clientId; }
}