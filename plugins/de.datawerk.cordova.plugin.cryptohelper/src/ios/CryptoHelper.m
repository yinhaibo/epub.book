#import "CryptoHelper.h"
#import "AGPBKDF2.h"
#import "AGCryptoBox.h"
#import "AGRandomGenerator.h"
#import <CommonCrypto/CommonDigest.h>
#import <CommonCrypto/CommonCryptor.h>

@implementation CryptoHelper

- (void)getRandomValue:(CDVInvokedUrlCommand *)command {
    NSMutableDictionary *options = [self parseParameters:command];
    size_t len = 16;
    NSString *length = [options objectForKey:@"length"];
    if(length != nil) {
        len = [length intValue];
    }
    
    NSData *data = [AGRandomGenerator randomBytes:len];
    NSString *value = [CryptoHelper convertDataToString:data];
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:value];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)deriveKey:(CDVInvokedUrlCommand *)command {
    NSMutableDictionary *options = [self parseParameters:command];
    NSString *password = [options objectForKey:@"password"];
    NSString *salt = [options objectForKey:@"salt"];
    
    [self.commandDelegate runInBackground:^{
        AGPBKDF2 *agpbkdf2 = [[AGPBKDF2 alloc] init];
        NSData *rawPassword = [agpbkdf2 deriveKey:password salt:[CryptoHelper convertStringToData:salt]];
        
        NSString *encodedPassword = [CryptoHelper convertDataToString:rawPassword];
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:encodedPassword];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void)validateKey:(CDVInvokedUrlCommand *)command {
    NSMutableDictionary *options = [self parseParameters:command];
    NSString *password = [options objectForKey:@"password"];
    NSString *encryptedPassword = [options objectForKey:@"encryptedPassword"];
    NSString *salt = [options objectForKey:@"salt"];
    
    [self.commandDelegate runInBackground:^{
        AGPBKDF2 *agpbkdf2 = [[AGPBKDF2 alloc] init];
        BOOL valid = [agpbkdf2 validate:password encryptedPassword:[CryptoHelper convertStringToData:encryptedPassword] salt:[CryptoHelper convertStringToData:salt]];
        
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:valid];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void)generateKeyPair:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        AGKeyPair *keyPair = [[AGKeyPair alloc] init];
        
        NSMutableDictionary *results = [NSMutableDictionary dictionary];
        [results setValue:[CryptoHelper convertDataToString:keyPair.privateKey] forKey:@"privateKey"];
        [results setValue:[CryptoHelper convertDataToString:keyPair.publicKey] forKey:@"publicKey"];
        
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:results];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void)encrypt:(CDVInvokedUrlCommand *)command {
    NSMutableDictionary *options = [self parseParameters:command];
    NSString *publicKey = [options objectForKey:@"publicKey"];
    NSString *privateKey = [options objectForKey:@"privateKey"];
    NSString *nonce = [options objectForKey:@"nonce"];
    NSString *data = [options objectForKey:@"data"];
    
    AGCryptoBox *cryptoBox = [[AGCryptoBox alloc] initWithKey:[CryptoHelper convertStringToData:publicKey] privateKey:[CryptoHelper convertStringToData:privateKey]];
    [self.commandDelegate runInBackground:^{
        NSError *error = nil;
        NSData *message = [data dataUsingEncoding:NSUTF8StringEncoding];
        NSData *result = [cryptoBox encrypt:message nonce:[CryptoHelper convertStringToData:nonce] error:&error];
        
        if(error == nil) {
            NSString *encodedResult = [CryptoHelper convertDataToString:result];
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:encodedResult];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } else {
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@""];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }
    }];
}

- (void)decrypt:(CDVInvokedUrlCommand *)command {
    NSMutableDictionary *options = [self parseParameters:command];
    NSString *publicKey = [options objectForKey:@"publicKey"];
    NSString *privateKey = [options objectForKey:@"privateKey"];
    NSString *nonce = [options objectForKey:@"nonce"];
    NSString *data = [options objectForKey:@"data"];
    
    AGCryptoBox *cryptoBox = [[AGCryptoBox alloc] initWithKey:[CryptoHelper convertStringToData:publicKey] privateKey:[CryptoHelper convertStringToData:privateKey]];
    [self.commandDelegate runInBackground:^{
        NSError *error = nil;
        NSData *message = [CryptoHelper convertStringToData:data];
        NSData *result = [cryptoBox decrypt:message nonce:[CryptoHelper convertStringToData:nonce] error:&error];
        
        if(error == nil) {
            NSString *encodedResult = [[NSString alloc] initWithData:result encoding:NSUTF8StringEncoding];
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:encodedResult];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } else {
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@""];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }
    }];
}

- (void)symmetricEncrypt:(CDVInvokedUrlCommand *)command {
    NSMutableDictionary *options = [self parseParameters:command];
    NSString *key = [options objectForKey:@"key"];
    NSString *data = [options objectForKey:@"data"];
    NSString *iv = [options objectForKey:@"IV"];
    
    NSData *dataRaw = [data dataUsingEncoding:NSUTF8StringEncoding];
    NSData *keyRaw = [CryptoHelper convertStringToData:key];
    NSData *ivRaw;
    if(iv == nil) {
        ivRaw = [AGRandomGenerator randomBytes:16];
    } else {
        ivRaw = [CryptoHelper convertStringToData:iv];
    }
    
    size_t outLength;
    size_t availableAESSize = dataRaw.length+kCCBlockSizeAES128-(dataRaw.length % kCCBlockSizeAES128);
    NSMutableData *cipherData = [NSMutableData dataWithLength:availableAESSize];
    
    CCCryptorStatus cryptorResult = CCCrypt(kCCEncrypt, // operation
                                            kCCAlgorithmAES, // Algorithm
                                            kCCOptionPKCS7Padding, // options
                                            keyRaw.bytes, // key
                                            keyRaw.length, // keylength
                                            ivRaw.bytes,// iv
                                            dataRaw.bytes, // dataIn
                                            dataRaw.length, // dataInLength,
                                            cipherData.mutableBytes, // dataOut
                                            cipherData.length, // dataOutAvailable
                                            &outLength); // dataOutMoved
    
    
    if (cryptorResult == kCCSuccess) {
        cipherData.length = outLength;
        
        NSMutableDictionary *results = [NSMutableDictionary dictionary];
        [results setValue:[CryptoHelper convertDataToString:cipherData] forKey:@"result"];
        [results setValue:[CryptoHelper convertDataToString:ivRaw] forKey:@"IV"];
        
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:results];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } else {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@""];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
}

- (void)symmetricDecrypt:(CDVInvokedUrlCommand *)command {
    NSMutableDictionary *options = [self parseParameters:command];
    NSString *key = [options objectForKey:@"key"];
    NSString *data = [options objectForKey:@"data"];
    NSString *iv = [options objectForKey:@"IV"];
    
    NSData *dataRaw = [CryptoHelper convertStringToData:data];
    NSData *keyRaw = [CryptoHelper convertStringToData:key];
    NSData *ivRaw = [CryptoHelper convertStringToData:iv];
    
    size_t outLength;
    size_t availableAESSize = dataRaw.length-(dataRaw.length % kCCBlockSizeAES128);
    NSMutableData *cipherData = [NSMutableData dataWithLength:availableAESSize];
    
    CCCryptorStatus cryptorResult = CCCrypt(kCCDecrypt, // operation
                                            kCCAlgorithmAES, // Algorithm
                                            kCCOptionPKCS7Padding, // options
                                            keyRaw.bytes, // key
                                            keyRaw.length, // keylength
                                            ivRaw.bytes,// iv
                                            dataRaw.bytes, // dataIn
                                            dataRaw.length, // dataInLength,
                                            cipherData.mutableBytes, // dataOut
                                            cipherData.length, // dataOutAvailable
                                            &outLength); // dataOutMoved
    
    
    if (cryptorResult == kCCSuccess) {
        cipherData.length = outLength;
        
        NSString *result = [[NSString alloc] initWithData:cipherData encoding:NSUTF8StringEncoding];
        //[self convertDataToString:cipherData];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:result];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } else {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@""];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    }
}

- (void)symmetricDecryptBatch:(CDVInvokedUrlCommand *)command {
    NSMutableDictionary *options = [command argumentAtIndex:0];
    NSString *key = [options objectForKey:@"key"];
    NSString *iv = [options objectForKey:@"IV"];
    
    NSData *keyRaw = [CryptoHelper convertStringToData:key];
    NSData *ivRaw = [CryptoHelper convertStringToData:iv];
    
    NSArray* batch = [command argumentAtIndex:1];
    
    NSMutableArray *results = [NSMutableArray array];
    for (NSMutableDictionary *dataObject in batch) {
        NSString *data = [dataObject objectForKey:@"data"];
        NSData *dataRaw = [CryptoHelper convertStringToData:data];
        
        size_t outLength;
        size_t availableAESSize = dataRaw.length-(dataRaw.length % kCCBlockSizeAES128);
        NSMutableData *cipherData = [NSMutableData dataWithLength:availableAESSize];
        
        CCCryptorStatus cryptorResult = CCCrypt(kCCDecrypt, // operation
                                                kCCAlgorithmAES, // Algorithm
                                                kCCOptionPKCS7Padding, // options
                                                keyRaw.bytes, // key
                                                keyRaw.length, // keylength
                                                ivRaw.bytes,// iv
                                                dataRaw.bytes, // dataIn
                                                dataRaw.length, // dataInLength,
                                                cipherData.mutableBytes, // dataOut
                                                cipherData.length, // dataOutAvailable
                                                &outLength); // dataOutMoved
        
        
        if (cryptorResult == kCCSuccess) {
            cipherData.length = outLength;
            
            NSString *result = [[NSString alloc] initWithData:cipherData encoding:NSUTF8StringEncoding];
            
            [dataObject setObject:result forKey:@"data"];
            [results addObject:dataObject];
        } else {
            [dataObject setObject:@"" forKey:@"data"];
            [results addObject:dataObject];
        }
    }
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:results];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)md5:(CDVInvokedUrlCommand *)command {
    NSMutableDictionary *options = [self parseParameters:command];
    NSString *data = [options objectForKey:@"data"];
    
    [self.commandDelegate runInBackground:^{
        
        NSString *md5String = [CryptoHelper MD5String:data];
        
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:md5String];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

+ (NSMutableData *)convertStringToData:(NSString *)hexString {
    NSMutableData *commandToSend = [[NSMutableData alloc] init];
    long byte;
    char bytes[3] = {'\0', '\0', '\0'};
    int i;
    for (i = 0; i < [hexString length] / 2; i++) {
        bytes[0] = (char) [hexString characterAtIndex:i * 2];
        bytes[1] = (char) [hexString characterAtIndex:i * 2 + 1];
        byte = strtol(bytes, NULL, 16);
        [commandToSend appendBytes:&byte length:1];
    }
    return commandToSend;
}

+ (NSString *)MD5String:(NSString *)data {
    const char *cstr = [data UTF8String];
    
    unsigned char result[16];
    CC_MD5(cstr, strlen(cstr), result);
    
    return [NSString stringWithFormat:
            @"%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X",
            result[0], result[1], result[2], result[3],
            result[4], result[5], result[6], result[7],
            result[8], result[9], result[10], result[11],
            result[12], result[13], result[14], result[15]
            ];
}

+ (NSString *)MD5StringFromData:(NSData *)data {
    unsigned char result[16];
    CC_MD5(data.bytes, data.length, result);
    
    return [NSString stringWithFormat:
            @"%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X",
            result[0], result[1], result[2], result[3],
            result[4], result[5], result[6], result[7],
            result[8], result[9], result[10], result[11],
            result[12], result[13], result[14], result[15]
            ];
}

+ (NSString *)convertDataToString:(NSData *)data {
    const unsigned char *dataBuffer = (const unsigned char *) [data bytes];
    
    if (!dataBuffer) {
        return [NSString string];
    }
    
    NSUInteger dataLength = [data length];
    NSMutableString *hexString = [NSMutableString stringWithCapacity:(dataLength * 2)];
    
    for (int i = 0; i < dataLength; ++i) {
        [hexString appendString:[NSString stringWithFormat:@"%02lx", (unsigned long) dataBuffer[i]]];
    }
    
    return [NSString stringWithString:hexString];
}

- (id)parseParameters:(CDVInvokedUrlCommand *)command {
    NSArray *data = [command arguments];
    if (data.count == 1) {
        return [data objectAtIndex:0];
    }
    return Nil;
}

@end
