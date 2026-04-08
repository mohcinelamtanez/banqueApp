package Controller;

import Dao.PretDaoImpl;
import Entite.Pret;
import Entite.TypePret;
import Entite.NiveauRisque;
import Entite.Statut;
import Servie.PretServiceImpl;
import Servie.RiskService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/pret")
public class PretController extends HttpServlet {

    private PretDaoImpl pretDao = new PretDaoImpl();
    private PretServiceImpl pretService = new PretServiceImpl();
    private Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd").create();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {
            String action = request.getParameter("action");
            String clientIdParam = request.getParameter("clientId");

            if ("calculerMensualite".equals(action)) {
                // Récupérer les paramètres
                double montant = Double.parseDouble(request.getParameter("montant"));
                double taux = Double.parseDouble(request.getParameter("taux"));
                int duree = Integer.parseInt(request.getParameter("duree"));
                double revenu = Double.parseDouble(request.getParameter("revenu")); // ajout revenu

                // Appel API risk
                // Calculer mensualité
                double mensualite = pretService.calculerMensualite(montant, taux, duree);
                System.out.println(mensualite);
                JsonObject riskResult = RiskService.calculerRisk(revenu, mensualite, duree, taux);
                System.out.println(riskResult) ;
                // Préparer la réponse complète
                Map<String, Object> result = new HashMap<>();
                result.put("mensualite", mensualite);
                result.put("montant", montant);
                result.put("taux", taux);
                result.put("duree", duree);
                result.put("score_risque", riskResult.get("score_risque").getAsDouble());
                result.put("decision", riskResult.get("decision").getAsString());

                out.print(gson.toJson(result));

            } else if (clientIdParam != null && !clientIdParam.isEmpty()) {
                // Récupérer les prêts d'un client
                int clientId = Integer.parseInt(clientIdParam);
                List<Pret> prets = pretDao.getPretsByClientId(clientId);
                out.print(gson.toJson(prets));

            } else {
                // Récupérer tous les prêts
                List<Pret> prets = pretDao.getAllPrets();
                out.print(gson.toJson(prets));
            }

        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Paramètres invalides");
            out.print(gson.toJson(error));
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur serveur: " + e.getMessage());
            out.print(gson.toJson(error));
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {
            // Lire le corps de la requête
            BufferedReader reader = request.getReader();
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }

            // Convertir JSON en Map d'abord
            Map<String, Object> data = gson.fromJson(sb.toString(), Map.class);
            Pret pret = new Pret();

            // Remplir l'objet Pret
            if (data.containsKey("Id") && data.get("Id") != null) {
                pret.setId(((Number) data.get("Id")).intValue());
            }

            if (data.containsKey("ClientId") && data.get("ClientId") != null) {
                pret.setClientId(((Number) data.get("ClientId")).intValue());
            }

            if (data.containsKey("typePret") && data.get("typePret") != null) {
                String typePretStr = data.get("typePret").toString();
                try {
                    pret.setTypePret(TypePret.valueOf(typePretStr));
                } catch (IllegalArgumentException e) {
                    pret.setTypePret(TypePret.Personnel);
                }
            }

            if (data.containsKey("MontantPret") && data.get("MontantPret") != null) {
                pret.setMontantPret(((Number) data.get("MontantPret")).doubleValue());
            }

            if (data.containsKey("Duree") && data.get("Duree") != null) {
                pret.setDuree(((Number) data.get("Duree")).intValue());
            }

            if (data.containsKey("TauxAnnuel") && data.get("TauxAnnuel") != null) {
                pret.setTauxAnnuel(((Number) data.get("TauxAnnuel")).doubleValue());
            }

            if (data.containsKey("Mensualite") && data.get("Mensualite") != null) {
                pret.setMensualite(((Number) data.get("Mensualite")).doubleValue());
            }

            if (data.containsKey("niveauRisque") && data.get("niveauRisque") != null) {
                String risqueStr = data.get("niveauRisque").toString();
                try {
                    pret.setNiveauRisque(NiveauRisque.valueOf(risqueStr));
                } catch (IllegalArgumentException e) {
                    pret.setNiveauRisque(NiveauRisque.Eleve);
                }
            }

            if (data.containsKey("statut") && data.get("statut") != null) {
                String statutStr = data.get("statut").toString();
                try {
                    pret.setStatut(Statut.valueOf(statutStr));
                } catch (IllegalArgumentException e) {
                    pret.setStatut(Statut.En_cours);
                }
            }

            // Validation
            if (pret.getClientId() <= 0 || pret.getMontantPret() <= 0 ||
                    pret.getDuree() <= 0 || pret.getTauxAnnuel() <= 0) {

                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Données du prêt invalides");
                out.print(gson.toJson(error));
                return;
            }

            // Calculer la mensualité si non fournie
            if (pret.getMensualite() <= 0) {
                double mensualite = pretService.calculerMensualite(
                        pret.getMontantPret(),
                        pret.getTauxAnnuel(),
                        pret.getDuree()
                );
                pret.setMensualite(mensualite);
            }

            // Définir les dates pour les prêts en cours
            if (pret.getStatut() == Statut.En_cours) {
                pret.setDateAccord(new Date());
                // Date de fin = aujourd'hui + durée en mois
                java.util.Calendar calendar = java.util.Calendar.getInstance();
                calendar.setTime(new Date());
                calendar.add(java.util.Calendar.MONTH, pret.getDuree());
                pret.setDateFin(calendar.getTime());
            }

            // Ajouter le prêt
            boolean success = pretService.ajouterPret(pret);

            if (success && pret.getId() > 0) {
                // Retourner le prêt créé
                Pret pretCree = pretDao.getPretById(pret.getId());
                out.print(gson.toJson(pretCree));
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Erreur lors de l'ajout du prêt");
                out.print(gson.toJson(error));
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur serveur: " + e.getMessage());
            out.print(gson.toJson(error));
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {
            // Lire le corps de la requête
            BufferedReader reader = request.getReader();
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }

            // Convertir JSON en Map
            Map<String, Object> data = gson.fromJson(sb.toString(), Map.class);

            // Vérifier l'ID
            if (!data.containsKey("Id") || data.get("Id") == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                Map<String, String> error = new HashMap<>();
                error.put("error", "ID du prêt manquant");
                out.print(gson.toJson(error));
                return;
            }

            int pretId = ((Number) data.get("Id")).intValue();
            Pret pret = pretDao.getPretById(pretId);

            if (pret == null) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Prêt non trouvé");
                out.print(gson.toJson(error));
                return;
            }

            // Mettre à jour les champs modifiés
            if (data.containsKey("statut") && data.get("statut") != null) {
                String statutStr = data.get("statut").toString();
                try {
                    pret.setStatut(Statut.valueOf(statutStr));
                } catch (IllegalArgumentException e) {
                    // Garder l'ancien statut
                }
            }

            if (data.containsKey("niveauRisque") && data.get("niveauRisque") != null) {
                String risqueStr = data.get("niveauRisque").toString();
                try {
                    pret.setNiveauRisque(NiveauRisque.valueOf(risqueStr));
                } catch (IllegalArgumentException e) {
                    // Garder l'ancien risque
                }
            }

            // Modifier le prêt
            boolean success = pretService.modifierPret(pret);

            if (success) {
                // Retourner le prêt modifié
                Pret pretModifie = pretDao.getPretById(pretId);
                out.print(gson.toJson(pretModifie));
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Erreur lors de la modification du prêt");
                out.print(gson.toJson(error));
            }

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur serveur: " + e.getMessage());
            out.print(gson.toJson(error));
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {
            String idParam = request.getParameter("id");

            if (idParam == null || idParam.isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                Map<String, String> error = new HashMap<>();
                error.put("error", "ID manquant");
                out.print(gson.toJson(error));
                return;
            }

            int id = Integer.parseInt(idParam);
            boolean success = pretService.supprimerPret(id);

            if (success) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("message", "Prêt supprimé avec succès");
                out.print(gson.toJson(result));
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Erreur lors de la suppression du prêt");
                out.print(gson.toJson(error));
            }

        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            Map<String, String> error = new HashMap<>();
            error.put("error", "ID invalide");
            out.print(gson.toJson(error));
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur serveur: " + e.getMessage());
            out.print(gson.toJson(error));
        }
    }
}