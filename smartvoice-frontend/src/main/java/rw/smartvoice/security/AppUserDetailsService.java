package rw.smartvoice.security;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import rw.smartvoice.model.User;
import rw.smartvoice.repository.UserRepository;

import java.util.List;

@Service
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public AppUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User u = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // ✅ IMPORTANT: must be ROLE_...
        List<SimpleGrantedAuthority> auth =
                List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name()));

        return new org.springframework.security.core.userdetails.User(
                u.getEmail(),
                u.getPasswordHash(),
                u.isEnabled(),
                true,
                true,
                true,
                auth
        );
    }
}
