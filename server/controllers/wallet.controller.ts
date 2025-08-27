/*import { Request, Response, NextFunction } from "express";
import { walletService } from "../services/wallet.service";
import { walletLogger } from "../utils/logger";
import { AuthenticatedRequest } from "../types/auth";

export class WalletController {
  // Generate authentication nonce
   
  async generateNonce(req: Request, res: Response, next: NextFunction) {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: "Wallet address is required"
        });
      }

      const result = await walletService.generateAuthNonce(walletAddress);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      walletLogger.error('Generate nonce controller error', {
        error: error.message,
        body: req.body
      });
      
      if (error.name === 'WalletConnectError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }

  //Verify signature and authenticate user

  async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        walletAddress,
        signature,
        publicKey,
        sessionId,
        signatureType,
        ipAddress,
        userAgent
      } = req.body;

      if (!walletAddress || !signature || !publicKey || !sessionId) {
        return res.status(400).json({
          success: false,
          error: "Wallet address, signature, public key, and session ID are required"
        });
      }

      const result = await walletService.verifySignatureAndAuthenticate(
        walletAddress,
        signature,
        publicKey,
        sessionId,
        signatureType,
        ipAddress || req.ip,
        userAgent || req.get('User-Agent')
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      walletLogger.error('Authentication controller error', {
        error: error.message,
        body: req.body
      });
      
      if (error.name === 'WalletConnectError') {
        return res.status(401).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Authentication failed"
      });
    }
  }

  // Validate session
   
  async validateSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "Session ID is required"
        });
      }

      const result = await walletService.validateSession(sessionId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      walletLogger.error('Validate session controller error', {
        error: error.message,
        params: req.params
      });
      
      if (error.name === 'WalletConnectError') {
        return res.status(401).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Session validation failed"
      });
    }
  }

  // Disconnect session
   
  async disconnectSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "Session ID is required"
        });
      }

      const result = await walletService.disconnectSession(sessionId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      walletLogger.error('Disconnect session controller error', {
        error: error.message,
        params: req.params
      });
      
      if (error.name === 'WalletConnectError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to disconnect session"
      });
    }
  }

  // Get user profile
   
  async getUserProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { walletAddress } = req.params;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: "Wallet address is required"
        });
      }

      const user = await walletService.getUserByWalletAddress(walletAddress);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error: any) {
      walletLogger.error('Get user profile controller error', {
        error: error.message,
        params: req.params
      });
      
      if (error.name === 'WalletConnectError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to get user profile"
      });
    }
  }

  // Update user profile
   
  async updateUserProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { walletAddress } = req.params;
      const profileData = req.body;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: "Wallet address is required"
        });
      }

      const updatedUser = await walletService.updateUserProfile(walletAddress, profileData);

      res.status(200).json({
        success: true,
        data: updatedUser
      });
    } catch (error: any) {
      walletLogger.error('Update user profile controller error', {
        error: error.message,
        params: req.params,
        body: req.body
      });
      
      if (error.name === 'WalletConnectError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to update user profile"
      });
    }
  }

  // Get user documents
   
  async getUserDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { walletAddress } = req.params;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: "Wallet address is required"
        });
      }

      const documents = await walletService.getUserDocuments(walletAddress);

      res.status(200).json({
        success: true,
        data: documents
      });
    } catch (error: any) {
      walletLogger.error('Get user documents controller error', {
        error: error.message,
        params: req.params
      });
      
      if (error.name === 'WalletConnectError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to get user documents"
      });
    }
  }

  // Get active sessions for user

  async getActiveSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { walletAddress } = req.params;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: "Wallet address is required"
        });
      }

      const sessions = await walletService.getUserActiveSessions(walletAddress);

      res.status(200).json({
        success: true,
        data: sessions
      });
    } catch (error: any) {
      walletLogger.error('Get active sessions controller error', {
        error: error.message,
        params: req.params
      });
      
      if (error.name === 'WalletConnectError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to get active sessions"
      });
    }
  }

  // Cleanup expired data (admin endpoint)
   
  async cleanupExpiredData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await walletService.cleanupExpiredData();

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      walletLogger.error('Cleanup expired data controller error', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: "Failed to cleanup expired data"
      });
    }
  }
}

export const walletController = new WalletController();*/