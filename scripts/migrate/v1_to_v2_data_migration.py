import click
import dataset

def migrate_config_table(db_v1, db_v2):
    v1_data=list(db_v1.query('SELECT * FROM "Configs"'))
    for row in v1_data:
        del row['id']
        db_v2['configs'].upsert(row, ['config_key'])
    print("Configs table migrated successfully")
def migrate_copyright_table(db_v1, db_v2):
    v1_data=list(db_v1.query('SELECT * FROM "Copyright"'))
    for row in v1_data:
        row['id']=str(row['id'])
        db_v2["copyrights"].upsert(row, ['id'])
    print("Copyright table migrated successfully")

def migrate_albums_table(db_v1, db_v2):
    v1_data=list(db_v1.query('SELECT * FROM "Tags"'))
    for row in v1_data:
        row['id']=str(row['id'])
        if "tag_value" in row:
            row['album_value']=row['tag_value']
            del row['tag_value']
            db_v2["albums"].upsert(row, ['album_value'])
    print("Albums table migrated successfully")

def migrate_images_table(db_v1, db_v2, batch_size=100):
    total_count = db_v1.query('SELECT COUNT(*) as count FROM "Images"').next()['count']
    print(f"Total records to migrate: {total_count}")

    offset = 0
    migrated_count = 0

    while offset < total_count:
        query = f'''
            SELECT * 
            FROM "Images" 
            LIMIT {batch_size} 
            OFFSET {offset}
        '''
        batch_data = list(db_v1.query(query))
        
        for row in batch_data:
            row['id'] = str(row['id'])
        
        if batch_data:
            db_v2["images"].upsert_many(batch_data, ['id'])
            
        migrated_count += len(batch_data)
        progress = (migrated_count / total_count) * 100
        print(f"Progress: {migrated_count}/{total_count} ({progress:.2f}%)")
        
        offset += batch_size
    
    print("Migration completed successfully!")
    
    v2_count = db_v2.query('SELECT COUNT(*) as count FROM "images"').next()['count']
    print(f"Records in source database: {total_count}")
    print(f"Records in target database: {v2_count}")

def migrate_images_albums_relation_table(db_v1, db_v2, batch_size=100):
    total_count = db_v1.query('SELECT COUNT(*) as count FROM "ImageTagRelation"').next()['count']
    print(f"Total image-album relations to migrate: {total_count}")

    offset = 0
    migrated_count = 0

    while offset < total_count:
        query = f'''
            SELECT * 
            FROM "ImageTagRelation"
            LIMIT {batch_size} 
            OFFSET {offset}
        '''
        batch_data = list(db_v1.query(query))
        
        for row in batch_data:
            row['imageId'] = str(row['imageId'])
            row['album_value'] = str(row['tag_value'])
            del row['tag_value']
        
        if batch_data:
            db_v2["images_albums_relation"].upsert_many(batch_data, ['imageId', 'album_value'])
            
        migrated_count += len(batch_data)
        progress = (migrated_count / total_count) * 100
        print(f"Progress: {migrated_count}/{total_count} ({progress:.2f}%)")
        
        offset += batch_size
    
    print("Image album relation migration completed successfully!")
    
    v2_count = db_v2.query('SELECT COUNT(*) as count FROM "images_albums_relation"').next()['count']
    print(f"Records in source database: {total_count}")
    print(f"Records in target database: {v2_count}")

def migrate_images_copyright_relation_table(db_v1, db_v2, batch_size=100):
    total_count = db_v1.query('SELECT COUNT(*) as count FROM "ImageCopyrightRelation"').next()['count']
    print(f"Total image-copyright relations to migrate: {total_count}")

    offset = 0
    migrated_count = 0

    while offset < total_count:
        query = f'''
            SELECT * 
            FROM "ImageCopyrightRelation"
            LIMIT {batch_size} 
            OFFSET {offset}
        '''
        batch_data = list(db_v1.query(query))
        
        for row in batch_data:
            row['copyrightId'] = str(row['copyrightId'])
            row['imageId'] = str(row['imageId'])
        
        if batch_data:
            db_v2["images_copyright_relation"].upsert_many(batch_data, ['copyrightId', 'imageId'])
            
        migrated_count += len(batch_data)
        progress = (migrated_count / total_count) * 100
        print(f"Progress: {migrated_count}/{total_count} ({progress:.2f}%)")
        
        offset += batch_size
    
    print("Images copyright relation migration completed successfully!")
    
    v2_count = db_v2.query('SELECT COUNT(*) as count FROM "images_copyright_relation"').next()['count']
    print(f"Records in source database: {total_count}")
    print(f"Records in target database: {v2_count}")


@click.command()
@click.option('--v1-url', help='V1 database URL',required=True, type=str)
@click.option('--v2-url', help='V2 database URL',required=True, type=str)
def main(v1_url:str, v2_url:str):
    db_v1 = dataset.connect(v1_url)
    db_v2 = dataset.connect(v2_url)
    migrate_config_table(db_v1, db_v2)
    migrate_copyright_table(db_v1, db_v2)
    migrate_albums_table(db_v1, db_v2)
    migrate_images_table(db_v1, db_v2)
    migrate_images_albums_relation_table(db_v1, db_v2)
    migrate_images_copyright_relation_table(db_v1, db_v2)

if __name__ == '__main__':
    main()