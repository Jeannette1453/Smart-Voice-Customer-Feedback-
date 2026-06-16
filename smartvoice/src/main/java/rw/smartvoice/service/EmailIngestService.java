package rw.smartvoice.service;

import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.search.FlagTerm;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import rw.smartvoice.dto.CreateFeedbackRequest;
import rw.smartvoice.model.*;
import rw.smartvoice.repository.UserRepository;

import java.util.Properties;
import java.util.UUID;

@Service
public class EmailIngestService {

    private final FeedbackService feedbackService;
    private final UserRepository userRepository;

    // Read from application.properties using @Value
    private final String host;
    private final int port;
    private final String username;
    private final String password;
    private final String folderName;

    public EmailIngestService(
            FeedbackService feedbackService,
            UserRepository userRepository,
            org.springframework.core.env.Environment env
    ) {
        this.feedbackService = feedbackService;
        this.userRepository = userRepository;

        this.host = env.getProperty("smartvoice.mail.imap.host");
        this.port = Integer.parseInt(env.getProperty("smartvoice.mail.imap.port", "993"));
        this.username = env.getProperty("smartvoice.mail.imap.username");
        this.password = env.getProperty("smartvoice.mail.imap.password");
        this.folderName = env.getProperty("smartvoice.mail.imap.folder", "INBOX");
    }

    // Poll every minute (you can change it)
    @Scheduled(fixedDelayString = "${smartvoice.mail.imap.poll-ms:60000}")
    public void pollInbox() {
        if (username == null || password == null) return; // not configured

        Store store = null;
        Folder inbox = null;

        try {
            Properties props = new Properties();
            props.put("mail.store.protocol", "imaps");
            props.put("mail.imaps.host", host);
            props.put("mail.imaps.port", String.valueOf(port));

            Session session = Session.getInstance(props);
            store = session.getStore("imaps");
            store.connect(host, username, password);

            inbox = store.getFolder(folderName);
            inbox.open(Folder.READ_WRITE);

            // unread emails only
            Message[] unread = inbox.search(new FlagTerm(new Flags(Flags.Flag.SEEN), false));

            for (Message msg : unread) {
                handleOneEmail(msg);

                // mark read
                msg.setFlag(Flags.Flag.SEEN, true);
            }

        } catch (Exception e) {
            System.out.println("Email poll failed: " + e.getMessage());
        } finally {
            try { if (inbox != null && inbox.isOpen()) inbox.close(); } catch (Exception ignored) {}
            try { if (store != null) store.close(); } catch (Exception ignored) {}
        }
    }

    private void handleOneEmail(Message msg) throws Exception {
        String fromEmail = extractFrom(msg);
        String subject = msg.getSubject() != null ? msg.getSubject() : "(no subject)";
        String body = extractText(msg);

        // find/create customer
        User customer = userRepository.findByEmail(fromEmail).orElseGet(() -> {
            User u = new User();
            u.setEmail(fromEmail);
            u.setFullName(fromEmail.split("@")[0]);
            u.setRole(Role.CUSTOMER);
            u.setEnabled(true);

            // random password hash placeholder (you can improve later)
            u.setPasswordHash("{noop}email-user");
            return userRepository.save(u);
        });

        // parse type/priority from subject/body (simple rules)
        FeedbackType type = guessType(subject, body);
        Priority priority = guessPriority(subject, body);

        CreateFeedbackRequest req = new CreateFeedbackRequest();
        req.type = type;
        req.priority = priority;
        req.category = "Email";
        req.subCategory = subject;
        req.message = body;

        feedbackService.createFeedback(customer.getId(), req);
    }

    private String extractFrom(Message msg) throws Exception {
        Address[] from = msg.getFrom();
        if (from == null || from.length == 0) return "unknown@unknown.com";
        InternetAddress ia = (InternetAddress) from[0];
        return ia.getAddress();
    }

    private String extractText(Part p) throws Exception {
        if (p.isMimeType("text/*")) return (String) p.getContent();

        if (p.isMimeType("multipart/*")) {
            Multipart mp = (Multipart) p.getContent();
            for (int i = 0; i < mp.getCount(); i++) {
                String text = extractText(mp.getBodyPart(i));
                if (text != null && !text.isBlank()) return text;
            }
        }
        return "";
    }

    private FeedbackType guessType(String subject, String body) {
        String s = (subject + " " + body).toLowerCase();
        if (s.contains("complaint") || s.contains("problem") || s.contains("bad")) return FeedbackType.COMPLAINT;
        if (s.contains("thanks") || s.contains("great") || s.contains("good")) return FeedbackType.COMPLIMENT;
        return FeedbackType.SUGGESTION;
    }

    private Priority guessPriority(String subject, String body) {
        String s = (subject + " " + body).toLowerCase();
        if (s.contains("urgent") || s.contains("asap") || s.contains("immediately")) return Priority.URGENT;
        if (s.contains("high")) return Priority.HIGH;
        if (s.contains("low")) return Priority.LOW;
        return Priority.MEDIUM;
    }
}