package com.trialroom;

import com.trialroom.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.lang.reflect.Field;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;

    // A valid Base64-encoded 256-bit key
    private static final String TEST_SECRET =
        "VGhpcyBpcyBhIHZlcnkgbG9uZyBzZWNyZXQga2V5IGZvciBKV1QgdGhhdCBpcyBhdCBsZWFzdCAyNTYgYml0cyBsb25n";

    @BeforeEach
    void setUp() throws Exception {
        tokenProvider = new JwtTokenProvider();
        setField(tokenProvider, "jwtSecret", TEST_SECRET);
        setField(tokenProvider, "jwtExpirationMs", 86400000L);
    }

    @Test
    @DisplayName("Generated token is not null or blank")
    void tokenIsGenerated() {
        UserDetails user = buildUser("testuser", "STAFF");
        String token = tokenProvider.generateToken(user);
        assertThat(token).isNotBlank();
    }

    @Test
    @DisplayName("Username extracted from token matches original")
    void usernameExtracted() {
        UserDetails user = buildUser("manager1", "MANAGER");
        String token = tokenProvider.generateToken(user);
        assertThat(tokenProvider.getUsernameFromToken(token)).isEqualTo("manager1");
    }

    @Test
    @DisplayName("Roles extracted from token match original")
    void rolesExtracted() {
        UserDetails user = buildUser("staff1", "STAFF");
        String token = tokenProvider.generateToken(user);
        List<String> roles = tokenProvider.getRolesFromToken(token);
        assertThat(roles).contains("ROLE_STAFF");
    }

    @Test
    @DisplayName("Valid token passes validation")
    void validTokenPasses() {
        UserDetails user = buildUser("admin", "ADMIN");
        String token = tokenProvider.generateToken(user);
        assertThat(tokenProvider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("Tampered token fails validation")
    void tamperedTokenFails() {
        UserDetails user = buildUser("admin", "ADMIN");
        String token = tokenProvider.generateToken(user);
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";
        assertThat(tokenProvider.validateToken(tampered)).isFalse();
    }

    @Test
    @DisplayName("Blank token fails validation")
    void blankTokenFails() {
        assertThat(tokenProvider.validateToken("")).isFalse();
        assertThat(tokenProvider.validateToken("not.a.jwt")).isFalse();
    }

    private UserDetails buildUser(String username, String role) {
        return User.builder()
            .username(username)
            .password("encoded")
            .authorities(new SimpleGrantedAuthority("ROLE_" + role))
            .build();
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
