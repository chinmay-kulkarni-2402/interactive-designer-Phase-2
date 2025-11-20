package com.example.htmlFilePath.Services;

import com.example.htmlFilePath.Entity.LogData;
import com.example.htmlFilePath.Repositor.LogBookRepo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class LogService {

	@Autowired
	private LogBookRepo logBookRepo;

	public void logActivity(Integer userId, String typeRequested, String result, String message, Date startTime) {
		try {
			LogData info = new LogData();
			info.setResult(result);
			info.setMessage(message);
			info.setSendRequestTime(startTime);
			info.setOutputResponseTime(new Date());

			logBookRepo.save(info);
		} catch (Exception e) {
			e.printStackTrace();
			System.err.println("Failed to log activity: " + e.getMessage());
		}
	}
}
