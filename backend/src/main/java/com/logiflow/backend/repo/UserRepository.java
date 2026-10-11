package com.logiflow.backend.repo;


import com.logiflow.backend.entities.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;


@Repository
public interface UserRepository extends JpaRepository<Users,Long> {
    Optional<Users> findByEmail(String email);
}
