package com.logiflow.backend.entities;

import com.logiflow.backend.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
@Builder
public class Users {

    @Id
    @GeneratedValue
    private long id;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String password;
    @Column(nullable = false)
    private String fullName;
    private String phone;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
