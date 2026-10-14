package com.logiflow.backend.service;

import com.logiflow.backend.dto.LoginRequest;
import com.logiflow.backend.dto.LoginResponse;
import com.logiflow.backend.entities.Users;
import com.logiflow.backend.repo.UserRepository;
import com.logiflow.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {

        Users user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return new LoginResponse(
                token,
                user.getEmail(),
                user.getFullName(),
                user.getRole().name()
        );
    }
}