package Entite;

public class Client {
    private int Id;
    private String Nom;
    private String Prenom;
    private String Ville;
    private String Cd_postal;
    private double Revenue;

    // Constructeurs
    public Client() {}

    public Client(String nom, String prenom, String ville, String cd_postal, double revenue) {
        this.Nom = nom;
        this.Prenom = prenom;
        this.Ville = ville;
        this.Cd_postal = cd_postal;
        this.Revenue = revenue;
    }

    // Getters/Setters (déjà fournis)
    public int getId() { return Id; }
    public void setId(int id) { this.Id = id; }

    public String getNom() { return Nom; }
    public void setNom(String nom) { this.Nom = nom; }

    public String getPrenom() { return Prenom; }
    public void setPrenom(String prenom) { this.Prenom = prenom; }

    public String getVille() { return Ville; }
    public void setVille(String ville) { this.Ville = ville; }

    public String getCd_postal() { return Cd_postal; }
    public void setCd_postal(String cd_postal) { this.Cd_postal = cd_postal; }

    public double getRevenue() { return Revenue; }
    public void setRevenue(double revenue) { this.Revenue = revenue; }
}