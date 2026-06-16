package rw.smartvoice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmartvoiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(SmartvoiceApplication.class, args);
  }
}