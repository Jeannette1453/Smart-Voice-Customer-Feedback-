package rw.smartvoice.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegal(IllegalArgumentException ex, HttpServletRequest req) {
        ApiError err = new ApiError(400, "Bad Request", ex.getMessage(), req.getRequestURI());
        return ResponseEntity.status(400).body(err);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(e -> e.getField() + " " + e.getDefaultMessage())
                .orElse("Validation error");
        ApiError err = new ApiError(400, "Bad Request", msg, req.getRequestURI());
        return ResponseEntity.status(400).body(err);
    }

    // ✅ 403 (role not allowed)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleDenied(AccessDeniedException ex, HttpServletRequest req) {
        ApiError err = new ApiError(403, "Forbidden", "Access Denied", req.getRequestURI());
        return ResponseEntity.status(403).body(err);
    }

    // ✅ 401 (not authenticated / bad token)
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuth(AuthenticationException ex, HttpServletRequest req) {
        ApiError err = new ApiError(401, "Unauthorized", "Unauthorized", req.getRequestURI());
        return ResponseEntity.status(401).body(err);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleAny(Exception ex, HttpServletRequest req) {
        ApiError err = new ApiError(500, "Internal Server Error", ex.getMessage(), req.getRequestURI());
        return ResponseEntity.status(500).body(err);
    }
}
