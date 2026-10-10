package com.logiflow.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<com.logiflow.backend.entity.Product,Long> {
}
