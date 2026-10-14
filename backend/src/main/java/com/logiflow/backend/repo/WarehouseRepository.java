package com.logiflow.backend.repo;

import com.logiflow.backend.entities.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
public interface WarehouseRepository extends JpaRepository<Warehouse,Long> {
}
