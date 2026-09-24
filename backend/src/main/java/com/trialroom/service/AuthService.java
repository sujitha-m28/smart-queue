package com.trialroom.service;

import com.trialroom.dto.request.LoginRequest;
import com.trialroom.dto.request.RegisterRequest;
import com.trialroom.dto.response.AuthResponse;
import com.trialroom.entity.Role;
import com.trialroom.entity.User;
import com.trialroom.exception.BadRequestException;
import com.trialroom.exception.ConflictException;
import com.trialroom.repository.RoleRepository;
import com.trialroom.repository.UserRepository;
import com.trialroom.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthResponse login(LoginRequest request) {
        // The demo credentials in README.md (admin@azorte.com, etc.) and the login
        // field itself imply email addresses work, but V2__create_users.sql seeds
        // the `username` column as 'admin'/'manager'/'staff1'/'staff2' with email
        // stored separately, and this only ever queried findByUsername(). Resolve
        // an email-style identifier to its real username before authenticating.
        String identifier = request.getUsername();
        String actualUsername = userRepository.findByUsername(identifier)
            .map(User::getUsername)
            .orElseGet(() -> userRepository.findByEmail(identifier)
                .map(User::getUsername)
                .orElse(identifier));

        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(actualUsername, request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(userDetails);

        User user = userRepository.findByUsername(actualUsername)
            .orElseThrow(() -> new BadRequestException("User not found"));

        List<String> roles = user.getRoles().stream()
            .map(Role::getName)
            .collect(Collectors.toList());

        return AuthResponse.builder()
            .token(token)
            .tokenType("Bearer")
            .username(user.getUsername())
            .roles(roles)
            .fullName(user.getFullName())
            .userId(user.getId().toString())
            .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username '" + request.getUsername() + "' is already taken");
        }
        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email '" + request.getEmail() + "' is already registered");
        }

        // Validate role — only allow STAFF, MANAGER, ADMIN
        String roleNameInput = request.getRole() != null ? request.getRole().toUpperCase() : "STAFF";
        final String roleName = Set.of("STAFF", "MANAGER", "ADMIN").contains(roleNameInput)
            ? roleNameInput : "STAFF";

        Role role = roleRepository.findByName(roleName)
            .orElseThrow(() -> new BadRequestException("Role not found: " + roleName));

        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName())
            .mobileNumber(request.getMobileNumber())
            .isActive(true)
            .roles(Set.of(role))
            .build();

        userRepository.save(user);

        // Generate token for the new user
        List<org.springframework.security.core.authority.SimpleGrantedAuthority> authorities = List.of(
            new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + roleName)
        );
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
            .username(user.getUsername())
            .password(user.getPasswordHash())
            .authorities(authorities)
            .build();

        String token = jwtTokenProvider.generateToken(userDetails);

        return AuthResponse.builder()
            .token(token)
            .tokenType("Bearer")
            .username(user.getUsername())
            .roles(List.of(roleName))
            .fullName(user.getFullName())
            .userId(user.getId().toString())
            .build();
    }
}
