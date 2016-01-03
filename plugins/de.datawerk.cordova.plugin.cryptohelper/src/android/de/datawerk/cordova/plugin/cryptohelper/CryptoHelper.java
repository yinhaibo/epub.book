package de.datawerk.cordova.plugin.cryptohelper;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.AlgorithmParameterSpec;
import java.security.spec.KeySpec;
import java.util.Arrays;
import java.util.Date;

import javax.crypto.Cipher;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;

import com.neilalexander.jnacl.NaCl;
import com.neilalexander.jnacl.crypto.curve25519xsalsa20poly1305;

public class CryptoHelper extends CordovaPlugin {
	
	private static final String LOG_TAG = "CryptoHelper";
	
	@Override
    public void initialize (CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
    }
    
	@Override
	public boolean execute(final String action, final String rawArgs, final CallbackContext callbackContext) throws JSONException {
        
		if ("getRandomValue".equals(action)) {
			Log.d(LOG_TAG, "getRandomValue called");
			
			cordova.getThreadPool().execute(new Runnable() {
				public void run() {
					try {
						JSONArray args = new JSONArray(rawArgs);
						JSONObject params = (JSONObject) args.get(0);
						int len = params.has("length") ? params.getInt("length") : 16;
                        
						final byte[] bytes = randomBytes(len);
						
						Log.d(LOG_TAG, "getRandomValue success: "+NaCl.asHex(bytes));
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, NaCl.asHex(bytes)));
					} catch (Exception e) {
						Log.d(LOG_TAG, "getRandomValue error: "+e.getMessage());
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, e.getMessage()));
					}
				}
			});
		}
        
		if ("deriveKey".equals(action)) {
			Log.d(LOG_TAG, "deriveKey called");
			
			cordova.getThreadPool().execute(new Runnable() {
				public void run() {
					try {
						JSONArray args = new JSONArray(rawArgs);
						JSONObject params = (JSONObject) args.get(0);
						String password = params.getString("password");
						byte[] salt = params.has("salt") ? NaCl.getBinary(params.getString("salt")) : null;
                        
						byte[] encryptSalt = salt != null ? salt : randomBytes(16);
						
						SecretKeyFactory keyFactory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1");
						KeySpec spec = new PBEKeySpec(password.toCharArray(), encryptSalt, 20000, 256);
						byte[] rawPassword = keyFactory.generateSecret(spec).getEncoded();
						
						Log.d(LOG_TAG, "deriveKey success: "+NaCl.asHex(rawPassword));
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, NaCl.asHex(rawPassword)));
					} catch (Exception e) {
						Log.d(LOG_TAG, "deriveKey error: "+e.getMessage());
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, e.getMessage()));
					}
				}
			});
		}
        
		if ("validateKey".equals(action)) {
			Log.d(LOG_TAG, "validateKey called");
			
			cordova.getThreadPool().execute(new Runnable() {
				public void run() {
					try {
						JSONArray args = new JSONArray(rawArgs);
						JSONObject params = (JSONObject) args.get(0);
						String password = params.getString("password");
						String encryptedPassword = params.getString("encryptedPassword");
						byte[] salt = NaCl.getBinary(params.getString("salt"));
                        
						SecretKeyFactory keyFactory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1");
						KeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 20000, 256);
						byte[] rawPassword = keyFactory.generateSecret(spec).getEncoded();
												
						boolean valid = Arrays.equals(NaCl.getBinary(encryptedPassword), rawPassword);
						
						Log.d(LOG_TAG, "validateKey success: "+valid);
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, String.valueOf(valid)));
					} catch (Exception e) {
						Log.d(LOG_TAG, "validateKey error: "+e.getMessage());
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, e.getMessage()));
					}
				}
			});
		}
        
		if ("generateKeyPair".equals(action)) {
			Log.d(LOG_TAG, "generateKeyPair called");
			
			cordova.getThreadPool().execute(new Runnable() {
				public void run() {
					try {
                        
						byte[] pk = new byte[curve25519xsalsa20poly1305.crypto_secretbox_PUBLICKEYBYTES];
						byte[] sk = new byte[curve25519xsalsa20poly1305.crypto_secretbox_SECRETKEYBYTES];
                        
						SecureRandom rng = new SecureRandom();
						rng.nextBytes(sk);
                        
						curve25519xsalsa20poly1305.crypto_box_keypair(pk, sk);
						JSONObject object = new JSONObject();
                        
						object.put("privateKey", NaCl.asHex(sk));
						object.put("publicKey", NaCl.asHex(pk));
                        
						Log.d(LOG_TAG, "generateKeyPair success: "+object);
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, object));
					} catch (Exception e) {
						Log.d(LOG_TAG, "generateKeyPair error: "+e.getMessage());
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, e.getMessage()));
					}
				}
			});
		}
        
		if ("decrypt".equals(action) || "encrypt".equals(action)) {
			Log.d(LOG_TAG, "decrypt or encrypt called");
			
			cordova.getThreadPool().execute(new Runnable() {
				public void run() {
					Date d = new Date();
					long startAt = d.getTime();
					
					try {
						JSONArray args = new JSONArray(rawArgs);
						JSONObject params = (JSONObject) args.get(0);
						final String publicKey = (String) params.get("publicKey");
						final String privateKey = (String) params.get("privateKey");
						final byte[] nonce = NaCl.getBinary((String) params.get("nonce"));
						final String data = (String) params.get("data");
                        
						Log.d(LOG_TAG, "decrypt or encrypt data length: "+data.length());
						
						NaCl cryptoBox = new NaCl(privateKey, publicKey);
                        
						String result = null;
						if ("encrypt".equals(action)) {
							result = NaCl.asHex(cryptoBox.encrypt(data.getBytes(), nonce));
						}
                        
						if ("decrypt".equals(action)) {
							result = new String(cryptoBox.decrypt(NaCl.getBinary(data), nonce));
						}
                        
						d = new Date();
						long duration = (d.getTime()-startAt)/1000;
						Log.d(LOG_TAG, "decrypt or encrypt duration: "+duration);
						Log.d(LOG_TAG, "decrypt or encrypt success: length: "+result.length());
						
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, result));
					} catch (Exception e) {
						Log.d(LOG_TAG, "decrypt or encrypt error: "+e.getMessage());
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, e.getMessage()));
					}
				}
			});
		}
        
		if ("symmetricEncrypt".equals(action)) {
			Log.d(LOG_TAG, "symmetric-encrypt called");
			
			cordova.getThreadPool().execute(new Runnable() {
				public void run() {
					try {
						JSONArray args = new JSONArray(rawArgs);
						JSONObject params = (JSONObject) args.get(0);
						
						byte[] key = NaCl.getBinary((String) params.get("key"));
						byte[] data = ((String) params.get("data")).getBytes();
						
						byte[] IV;
						if(params.has("IV")) {
							IV = NaCl.getBinary((String) params.get("IV"));
						} else {
							IV = randomBytes(16);
						}						
						
						AlgorithmParameterSpec ivSpec = new IvParameterSpec(IV);
				    	SecretKeySpec newKey = new SecretKeySpec(key, "AES");
				    	Cipher cipher = null;
						cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
						cipher.init(Cipher.ENCRYPT_MODE, newKey, ivSpec);
						byte[] result = cipher.doFinal(data);
                        
			            Log.d(LOG_TAG, "symmetric-encrypt success: length: "+result.length);
			            
			            JSONObject object = new JSONObject();
                        
						object.put("IV", NaCl.asHex(IV));
						object.put("result", NaCl.asHex(result));
						
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, object));
					} catch (Exception e) {
						Log.d(LOG_TAG, "symmetric-encrypt error: "+e.getMessage());
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, e.getMessage()));
					}
				}
			});
		}
		
		if ("symmetricDecrypt".equals(action)) {
			Log.d(LOG_TAG, "symmetric-decrypt called");
			
			cordova.getThreadPool().execute(new Runnable() {
				public void run() {
					try {
						JSONArray args = new JSONArray(rawArgs);
						JSONObject params = (JSONObject) args.get(0);
						
						byte[] key = NaCl.getBinary((String) params.get("key"));
						byte[] IV = NaCl.getBinary((String) params.get("IV"));
						byte[] data = NaCl.getBinary((String) params.get("data"));
						
						AlgorithmParameterSpec ivSpec = new IvParameterSpec(IV);
						SecretKeySpec newKey = new SecretKeySpec(key, "AES");
						Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
						cipher.init(Cipher.DECRYPT_MODE, newKey, ivSpec);
						byte[] result = cipher.doFinal(data);
						
						Log.d(LOG_TAG, "symmetric-decrypt success: length: "+result.length);
			            
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, new String(result)));
					} catch (Exception e) {
						Log.d(LOG_TAG, "symmetric-decrypt error: "+e.getMessage());
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, e.getMessage()));
					}
				}
			});
		}
		
		if ("symmetricDecryptBatch".equals(action)) {
			Log.d(LOG_TAG, "symmetric-decrypt-batch called");
			
			cordova.getThreadPool().execute(new Runnable() {
				public void run() {
					try {
						JSONArray args = new JSONArray(rawArgs);
						JSONObject params = (JSONObject) args.get(0);
						JSONArray dataArray = (JSONArray) args.get(1);
						
						byte[] key = NaCl.getBinary((String) params.get("key"));
						byte[] IV = NaCl.getBinary((String) params.get("IV"));
						
						JSONArray results = new JSONArray();
						
						for (int i = 0; i < dataArray.length(); i++) {
							JSONObject dataObject = (JSONObject) dataArray.get(i);
							
							byte[] data = NaCl.getBinary(dataObject.getString("data"));
							
							try {
								AlgorithmParameterSpec ivSpec = new IvParameterSpec(IV);
								SecretKeySpec newKey = new SecretKeySpec(key, "AES");
								Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
								cipher.init(Cipher.DECRYPT_MODE, newKey, ivSpec);
								byte[] result = cipher.doFinal(data);
								
								dataObject.put("data", new String(result));
							} catch (Exception e) {
								dataObject.put("data", "");
							}
							
							results.put(dataObject);
						}
						
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, results));
					} catch (Exception e) {
						Log.d(LOG_TAG, "symmetric-decrypt error: "+e.getMessage());
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, e.getMessage()));
					}
				}
			});
		}
		
		if ("md5".equals(action)) {
			Log.d(LOG_TAG, "md5 called");
			
			cordova.getThreadPool().execute(new Runnable() {
				public void run() {
					try {
						JSONArray args = new JSONArray(rawArgs);
						JSONObject params = (JSONObject) args.get(0);
						String data = params.getString("data");
                        
						MessageDigest md = MessageDigest.getInstance("MD5");
						md.update(data.getBytes());
						byte[] digest = md.digest();
						StringBuffer sb = new StringBuffer();
						for (byte b : digest) {
							sb.append(String.format("%02x", b & 0xff));
						}
                        
						Log.d(LOG_TAG, "md5 success: "+sb.toString());
						
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, sb.toString()));
					} catch (Exception e) {
						Log.d(LOG_TAG, "md5 error: "+e.getMessage());
						callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, e.getMessage()));
					}
				}
			});
		}
        
		return true;
	}
	
	private static byte[] randomBytes(int n) {
        byte[] buffer = new byte[n];
        try {
        	SecureRandom secureRandom = SecureRandom.getInstance("SHA1PRNG");
        	secureRandom.nextBytes(buffer);
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
        
        return buffer;
    }
	
}
