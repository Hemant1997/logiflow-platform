package com.logiflow.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import com.logiflow.backend.entities.Product;
public interface ProductRepository extends JpaRepository<Product,Long> {
}
