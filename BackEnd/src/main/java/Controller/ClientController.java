package Controller;

import Dao.ClientDaoImpl;
import Entite.Client;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/client")
public class ClientController extends HttpServlet {

    private ClientDaoImpl clientDao = new ClientDaoImpl();
    private Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd").create();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {
            String idParam = request.getParameter("id");
            String searchParam = request.getParameter("search");

            if (idParam != null && !idParam.isEmpty()) {
                // Récupérer un client par ID
                int id = Integer.parseInt(idParam);
                Client client = clientDao.getClientById(id);

                if (client != null) {
                    out.print(gson.toJson(client));
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    Map<String, String> error = new HashMap<>();
                    error.put("error", "Client non trouvé");
                    out.print(gson.toJson(error));
                }

            } else if (searchParam != null && !searchParam.isEmpty()) {
                // Rechercher des clients
                List<Client> clients = clientDao.rechercherClients(searchParam);
                out.print(gson.toJson(clients));

            } else {
                // Récupérer tous les clients
                List<Client> clients = clientDao.getAllClients();
                out.print(gson.toJson(clients));
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

            // Convertir JSON en Client
            Client client = gson.fromJson(sb.toString(), Client.class);

            // Validation simple
            if (client.getNom() == null || client.getNom().isEmpty() ||
                    client.getPrenom() == null || client.getPrenom().isEmpty() ||
                    client.getRevenue() <= 0) {

                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Données client invalides");
                out.print(gson.toJson(error));
                return;
            }

            // Ajouter le client
            boolean success = clientDao.ajouterClient(client);

            if (success && client.getId() > 0) {
                // Retourner le client créé avec son ID
                out.print(gson.toJson(client));
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Erreur lors de l'ajout du client");
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

            // Convertir JSON en Client
            Client client = gson.fromJson(sb.toString(), Client.class);

            // Vérifier que l'ID existe
            if (client.getId() <= 0) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                Map<String, String> error = new HashMap<>();
                error.put("error", "ID client manquant");
                out.print(gson.toJson(error));
                return;
            }

            // Modifier le client
            boolean success = clientDao.modifierClient(client);

            if (success) {
                // Retourner le client modifié
                Client clientModifie = clientDao.getClientById(client.getId());
                out.print(gson.toJson(clientModifie));
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Erreur lors de la modification du client");
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
            boolean success = clientDao.supprimerClient(id);

            if (success) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("message", "Client supprimé avec succès");
                out.print(gson.toJson(result));
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Erreur lors de la suppression du client");
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