'''
CMPE-285: Software Engineering Processes
Spring 2022, Prof. Sinn
Project: Stock Portfolio Suggestion Engine

Team Members:
Alex Hong (ID# 009556820)
John Monsod (ID# 015234505)
Ganesh Nehru (ID# 009509747)
Rodrigo Colasso (ID# 015954146)
'''

import json

from flask import Flask, request, render_template
from flask_restplus import Api, Resource, fields, reqparse
from pytz import timezone

import requests
import yfinance as yf
import datetime
import json as json_parser

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import PrimaryKeyConstraint, text
from flask import jsonify
import pymysql
import dbcreds

from itertools import groupby
from operator import itemgetter

import json as json_parser

import hashlib, binascii
import os



flask_app = Flask(__name__)

app = Api( app = flask_app,
           version = '1.0',
           title = 'Investment Recommender APIs',
           description = 'Recommends ETFs and stocks based on chosen investment strategies')

ns = app.namespace('api/v1', description='Investment Recommender')

flask_app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://{}:{}@{}/{}'.format( dbcreds.user, dbcreds.passwd, dbcreds.host, dbcreds.dbname ) 

db = SQLAlchemy( flask_app )

# 1-time salt for encryping passwords
# Can make random per-runtime session, e.g. os.urandom(32),
# but will need to store in the DB per user creds if so.
SALT = bytes(dbcreds.dbname, 'utf-8')

login_data = ns.model(
    'login_data',
    {
        'user_username': fields.String(description='username', required=True),
        'user_password': fields.String(description='md5(password)', required=True)
    }
)

user_data = ns.model(
    'user_data',
    {
        'user_name': fields.String(description='User Full Name', required=True),
        'user_username': fields.String(description='username', required=True),
        'user_password': fields.String(description='md5(password)', required=True)
    }
)

update_user_data = ns.model(
    'update_user_data',
    {
        'user_id': fields.Integer(description='User ID', required=True),
        'user_name': fields.String(description='User Full Name', required=True),
        'user_username': fields.String(description='username', required=True),
        'user_password': fields.String(description='md5(password)', required=True)
    }
)

asset_entry = ns.model(
     'asset_data',
     {
       'stock_etf_id': fields.Integer,
       'num_shares': fields.Float
     }
)

invest_data = ns.model(
    'invest_data',
    {
        'user_id': fields.Integer(description='User ID', required=True),
        'invt_datetime': fields.DateTime(description='Investment DateTime', required=True),
        'invt_value': fields.Float(description='Investment Value', required=True),
        'assets': fields.List(fields.Nested(asset_entry))
    }
)


@ns.route('/user', methods = ['POST','PUT'])
class User(Resource):
  
  @ns.expect(user_data)
  def post(self):

    json = json_parser.loads( request.data )
    
    user = User.query.filter_by( user_username = json['user_username'] ).first()

    if( user ):

        data = {

            'success': False,
            'message': 'Username already exits' }

    else:    

        user = User( 

            user_name = json['user_name'], 
            user_username = json['user_username'],
            user_password = get_hashed_password(json['user_username'], json['user_password'])
        )
    
        db.session.add( user )
    
        db.session.commit()

        data = {

            'user_id' : user.user_id,
            'user_name': json['user_name'],
            'user_username': json['user_username'],
            'success': True,
            'message': 'User created successfully' }

    return data
    
  @ns.expect(update_user_data)
  def put(self):

    json = json_parser.loads( request.data )

    user = User.query.get( json['user_id'] )

    user.user_name = json['user_name']
    user.user_username = json['user_username']
    user.user_password = get_hashed_password(json['user_username'], json['user_password'])
    
    db.session.commit()

    data = {

        'user_id' : json['user_id'],
        'user_name': json['user_name'],
        'user_username': json['user_username'],
        'success': True,
        'message': 'User updated successfully' }

    return data

@ns.route('/user/login', methods = ['POST'])
class Login(Resource):
  
  @ns.expect(login_data)
  def post(self):

    json = json_parser.loads( request.data )

    user = User.query.filter_by( user_username = json['user_username'], user_password = get_hashed_password(json['user_username'], json['user_password']) ).first()

    if( user ):

        data = {

            'user_id' : user.user_id,
            'user_name': user.user_name,
            'user_username': user.user_username,
            'success': True,
            'message': 'User logged in successfully' }

    else:

        data = {

            'success': False,
            'message': 'username or password is incorrect' }

    return data

@ns.route('/strategy/all', methods = ['GET'])
class AllStrategy(Resource):

  def get(self):

    strategies = []

    for strategy in Strategy.query.all():

        strategies.append( strategy.to_json() )

    return { "strategies" : strategies } 

@ns.route('/strategy/<id>/assets/<amt>', methods = ['GET'])
class StrategyAssets(Resource):

  def get(self, id, amt):
    '''

    Pseudo-code:
    Given an amount to invest (amt) and strategy (id), generate the
    recommended amount to invest into each asset recommended.
    1. Get the stocks and ETFs recommended for the strategy suppliedcw, example:.
    mysql> SELECT * FROM asset WHERE strategy_id=1;
    +----------+-------------+--------------+----------------------------------------------+---------------+
    | asset_id | strategy_id | asset_symbol | asset_name                                   | asset_isStock |
    +----------+-------------+--------------+----------------------------------------------+---------------+
    |        1 |           1 | GILD         | Gilead Sciences, Inc.                        |             1 |
    |        2 |           1 | CRM          | Salesforce, Inc.                             |             1 |
    |        3 |           1 | HPE          | Hewlett Packard Enterprise Company           |             1 |
    |        4 |           1 | PRBLX        | Parnassus Core Equity Fund - Investor Shares |             0 |
    |        5 |           1 | ESGV         | Vanguard ESG U.S. Stock ETF                  |             0 |
    +----------+-------------+--------------+----------------------------------------------+---------------+
    2. For each asset, get performance data over the last 12 months.
    3. Rank them to get the top 4 over the last 12, 6, 3, and 1 month back.
    4. Divide the amount to invest across the 4 chosen assets based on
       their relative performance to each other.
    5. Return the data for the chosen 4, with their respective investment amount.
    '''
    #print('DEBUG: strategy ID: {}, amt: {}'.format(id, amt))

    #asset = Asset.query.filter_by( strategy_id = id ).first()
    #print('DEBUG: {} / {} / {}'.format(asset.asset_symbol, asset.asset_name, asset.asset_isStock))
    assets = Asset.query.filter_by( strategy_id = id )
    #[print('DEBUG: {} / {} / {}'.format(x.asset_symbol, x.asset_name, x.asset_isStock)) for x in assets]

    data = { 'amount' : amt, 'strategy_id' : id }
    data_assets = []
    
    investable = float( amt )
    
    # Get n best perfomance asset
    best_performance = get_performance_asset( [ asset.asset_symbol for asset in assets ] )

    asset_breakdown = [ 0.4, 0.3, 0.2, 0.1 ]

    for asset in assets:
        
        current_asset = best_performance.get( asset.asset_symbol )

        if( current_asset ):

            # Get percentage
            percentage = asset_breakdown[ current_asset[ 0 ] ]

            # Calculate current_value
            current_value = investable * percentage

            # Calculate num_shares
            num_shares = current_value / current_asset[ 1 ]

            entry = {

                'stock_etf_id': asset.asset_id,
                'symbol': asset.asset_symbol,
                'name': asset.asset_name,
                'num_shares': round(num_shares,2),
                'current_value': current_value,
                'percentage': percentage * 100 }

            data_assets.append(entry)
        
    data['assets'] = data_assets

    return data

@ns.route('/investment', methods = ['POST'])
class Investment(Resource):
  @ns.expect(invest_data)
  def post(self):

    json = json_parser.loads( request.data )

    current_investment = Investment.query.filter_by( user_id = json['user_id'], invt_disabled = 0 ).first()

    if( current_investment ):

        current_investment.invt_disabled = 1

    investment = Investment (

        user_id = json['user_id'], 
        invt_datetime = json['invt_datetime'],
        invt_value = json['invt_value'],
        invt_disabled = 0 )

    for key in json['assets']:

        print('DEBUG: ***KEY*** invt_id: {}, stock_etf_id: {}, num_shares: {}'.format(investment.invt_id, key['stock_etf_id'], key['num_shares']))
        invt_asset = Investment_assets( invt_id = investment.invt_id , asset_id = key['stock_etf_id'] , number_shares = key['num_shares'] )

        investment.invt_asset.append( invt_asset )

    db.session.add( investment )
    db.session.commit()
    print('DEBUG: *** SAVED investment record ***')

    insert_history( investment, 5 )
    print('DEBUG: *** SAVED investment_history record ***')

    data = {
        'success': True,
        'message': 'Investment created successfully' }

    return data

@ns.route('/investment/current/user/<int:id>', methods = ['GET'])
class CurrentInvestment(Resource):

  def get(self, id):

    investment = Investment.query.filter_by( user_id = id, invt_disabled = 0 ).first()

    if( investment ):

        assets = []

        for i in range( len( investment.invt_asset ) ):

            assets.append( { 'index' : i, 'strategy_id' : investment.invt_asset[i].asset.strategy.strategy_id } )
        
        # Sort assets by strategy id
        assets = sorted( assets, key = itemgetter( 'strategy_id' ) )

        strategies = []

        # Display data grouped by strategy_id
        for key, value in groupby( assets, key = itemgetter( 'strategy_id' ) ):

            assets_json = []

            asset = investment.invt_asset[0]

            total_value = 0
            for k in value:

                invt_asset = investment.invt_asset[ k[ 'index' ] ]

                current_value = get_current_value(invt_asset.asset.asset_symbol, invt_asset.number_shares)
                total_value += current_value
                assets_json.append( { 
                    'asset_id' : invt_asset.asset.asset_id,
                    'symbol' : invt_asset.asset.asset_symbol,
                    'name' : invt_asset.asset.asset_name,
                    'current_value' : current_value,
                    'num_shares' : invt_asset.number_shares } )

            print('DEBUG: total_value: {}'.format(total_value))
            for asset_entry in assets_json:
                percentage = asset_entry['current_value'] / total_value * 100
                asset_entry['percentage'] = percentage
                print('DEBUG: asset_entry: {}'.format(asset_entry))

            strategy = {
                "strategy_id": invt_asset.asset.strategy.strategy_id,
                "strategy_name": invt_asset.asset.strategy.strategy_name,
                "assets" : assets_json }

            strategies.append( strategy )

        data = { 
            
            'user_id'       : investment.user_id,
            'invt_datetime' : investment.invt_datetime.strftime('%Y-%m-%d %H:%M:%S'),
            'invt_value'    : investment.invt_value,

            'strategies': strategies }

    else:

        data = {
             'success': False,
             'message': 'The user doesn\'t have an active investment' }
             
    return data

@ns.route('/investment/history/user/<int:id>', methods=['GET'])
class History(Resource):
    def get(self, id):

        yesterday = datetime.date.today() - datetime.timedelta(days=1)
        # Check if weekend and adjust to avoid
        if yesterday.weekday() > 4:
            delta = yesterday.weekday() % 4
            yesterday = yesterday - datetime.timedelta(days=delta)

        investment = Investment.query.filter_by(user_id=id, invt_disabled=0).first()
        if ( not investment ):
            return {
             'success': False,
             'message': 'The user doesn\'t have an active investment' }
        print('investment history: {}'.format(investment.history))

        history_length = len(investment.history)

        last_history_date = investment.history[history_length-1].history_date

        num_of_days = (yesterday - last_history_date).days

        if num_of_days > 0:
            insert_history(investment , num_of_days)

        investment = Investment.query.filter_by(user_id=id, invt_disabled=0).first()

        if investment:

            assets = []

            for i in range(len(investment.invt_asset)):
                assets.append({'index': i, 'strategy_id': investment.invt_asset[i].asset.strategy.strategy_id})

            # Sort assets by strategy id
            assets = sorted(assets, key=itemgetter('strategy_id'))

            strategies = []

            # Display data grouped by strategy_id
            for key, value in groupby(assets, key=itemgetter('strategy_id')):

                assets_json = []

                asset = investment.invt_asset[0]

                for k in value:
                    invt_asset = investment.invt_asset[k['index']]

                    db.session.commit()
                    history = Investment_history.query.filter_by(invt_id = investment.invt_id , asset_id = invt_asset.asset.asset_id).order_by(Investment_history.history_date.desc()).limit(5)

                    history_json = []

                    for hist in history:
                        history_json.append({
                            'day': hist.history_date.strftime('%Y-%m-%d'),
                            'value': hist.history_value})

                    assets_json.append({
                        'asset_id': invt_asset.asset.asset_id,
                        'symbol': invt_asset.asset.asset_symbol,
                        'name': invt_asset.asset.asset_name,
                        'history': history_json})

                strategy = {
                    "strategy_id": invt_asset.asset.strategy.strategy_id,
                    "strategy_name": invt_asset.asset.strategy.strategy_name,
                    "assets": assets_json}

                strategies.append(strategy)

            return {'strategies': strategies}

'''
@ns.route('/investment/debug/<string:symbol>', methods=['GET'])
class Debug(Resource):

    def get(self, symbol):

        get_asset_data( symbol, 5 )
'''
def get_performance_asset( symbols, period = '1y', number_assets = 4 ):

    data = yf.download(
        tickers = symbols,
        period = period,
        interval = '1d',
        group_by = 'ticker', 
        auto_adjust = True,   # adjust all OHLC (open-high-low-close)
        prepost = True,       # download market hours data
        threads = True,       # threads for mass downloading
        proxy = None ) 

    # Get column 'Close' ( Stock value when Market closes )
    data = data.iloc[ : , data.columns.get_level_values(1) == 'Close' ]

    # Drop the first level of columns ( leave just assets symbol )
    data.columns = data.columns.droplevel( 1 )
    
    # Save the second last day to return the current asset value
    backup = data.iloc[ -2 : -1 ]

    # Calculate how much (%) the stock changed per day and transposing the dataset
    data = round( data.pct_change() * 100, 2 ).T

    # Sum all the changed percentage in a new column
    data['total'] = data.sum( axis = 1)

    # Sorting the dataset by the total column in ascending order ( best performance first ) 
    data = data.sort_values( by = [ 'total' ], ascending = False )

    # Converting to dictionary to easy and constant time access
    assets = { }

    # Returning 'number_assets' first assets
    for i in range ( number_assets ) :

        asset = data.index.values.tolist()[ i ]

        if backup[ asset ][ 0 ] == 0:

            backup[ asset ][ 0 ] = 0.001

        assets[ asset ] = [ i, backup[ asset ][ 0 ] ]

    print( assets )
    
    return assets

def get_asset_data( symbol, num_days ):

    print('DEBUG: get_asset_data() -- symbol: {}, num_days: {}'.format(symbol, num_days))

    # Added two days to cover weekends where the stock market is closed
    days = num_days + 2

    today = datetime.datetime.today().strftime( '%Y-%m-%d' )
    print('DEBUG: get_asset_data() -- today: {}'.format(today))

    past_date = ( datetime.datetime.today() - datetime.timedelta( days = days ) ).strftime( '%Y-%m-%d' )
    print('DEBUG: get_asset_data() -- past_date: {}'.format(past_date))

    # Returning just the last num_days days as requested
    return ( yf.download( symbol, start = past_date, end = today )[ 'Adj Close' ] )[ -num_days: ]

def insert_history( investment, num_days ):

    for i in investment.invt_asset:

        print('DEBUG: insert_history() ****************************** iter: {} {} ******************************'.format(i.asset.asset_symbol, num_days))
        data = get_asset_data( i.asset.asset_symbol, num_days )

        for j in range( len ( data ) ):

            print('DEBUG: insert_history() --  j={} invt_id: {}, asset_id: {}, history_date: {}, history_value: {}'.format(j, i.invt_id, i.asset_id, data.index[j], data[j]*i.number_shares))
            history = Investment_history( 
                invt_id = i.invt_id,
                asset_id = i.asset_id,
                history_date = data.index[j], 
                history_value = data[j] * i.number_shares )

            try:
                db.session.add( history )
                print('DEBUG: insert_history() -- saved for j={}'.format(j))
            except FlushError as e:
                print('DEBUG: insert_history() -- ERROR: flush error')

        print('DEBUG: insert_history() -- READY TO COMMIT for {} {}..'.format(i.asset.asset_symbol, num_days))
        db.session.commit()

def get_current_value( asset_symbol, num_shares):
    data = get_asset_data( asset_symbol, 1 )
    return num_shares * data[0]

def get_hashed_password( username, raw_pwd ):
    to_encrypt = username + raw_pwd
    key = hashlib.pbkdf2_hmac('sha256', to_encrypt.encode('utf-8'), SALT, 100000)
    hashed_pwd = binascii.hexlify(key)[:32]
    print('DEBUG: hashed pwd: {}'.format(hashed_pwd))
    return hashed_pwd

class User( db.Model ):

    user_id = db.Column( db.Integer, primary_key = True )
    user_name = db.Column( db.String( 50 ), nullable = False )
    user_username = db.Column( db.String( 50 ), unique = True, nullable = False )
    user_password = db.Column( db.String( 255 ), nullable = False )

    investments = db.relationship( 'Investment', backref = 'user', lazy = True )

    def __repr__(self):

        return '<User %r>' % self.user_name

    def to_json(self):

        json_user = {

            'user_id': self.user_id,
            'user_name': self.user_name,
            'user_username': self.user_username }

        return json_user

class Strategy( db.Model ):

    __tablename__ = 'investment_strategy'

    strategy_id = db.Column( db.Integer, primary_key = True )
    strategy_name = db.Column( db.String( 20 ), nullable = False )

    assets = db.relationship( 'Asset', backref = 'strategy', lazy = True )
    
    def __repr__( self ):

        return '<Strategy %r>' % self.strategy_name

    def to_json( self ):

        json_user = {

            'strategy_id': self.strategy_id,
            'strategy_name': self.strategy_name }

        return json_user

class Investment_assets(db.Model):

    __tablename__ = 'investment_assets'

    invt_id = db.Column( db.Integer, db.ForeignKey( 'investment.invt_id' ), primary_key = True )
    asset_id = db.Column( db.Integer, db.ForeignKey( 'asset.asset_id' ), primary_key = True )
    number_shares = db.Column( db.Float, nullable = False )

class Investment_history(db.Model):

    history_date = db.Column( db.DateTime, primary_key = True )
    history_value = db.Column( db.Float, nullable = False )

    invt_id = db.Column( db.Integer, db.ForeignKey( 'investment.invt_id' ), nullable = False )
    asset_id = db.Column( db.Integer, db.ForeignKey( 'asset.asset_id' ), nullable = False )

class Asset(db.Model):

    asset_id = db.Column( db.Integer, primary_key = True )
    asset_symbol = db.Column( db.String( 5 ), nullable = False )
    asset_name = db.Column( db.String( 20 ), nullable = False )
    asset_isStock = db.Column( db.Integer, nullable = False )

    strategy_id = db.Column( db.Integer, db.ForeignKey( 'investment_strategy.strategy_id' ), nullable = False )

    invt_asset = db.relationship('Investment_assets', backref = 'asset', primaryjoin = asset_id == Investment_assets.asset_id  )

class Investment(db.Model):

    invt_id = db.Column( db.Integer, primary_key = True )
    invt_datetime = db.Column( db.DateTime, nullable = False )
    invt_value = db.Column( db.Float, nullable = False )
    invt_disabled = db.Column( db.Integer, nullable = False )

    user_id = db.Column( db.Integer, db.ForeignKey( 'user.user_id' ), nullable = False )

    invt_asset = db.relationship('Investment_assets', backref = 'investment', primaryjoin = invt_id == Investment_assets.invt_id  )

    history = db.relationship('Investment_history', backref = 'investment', primaryjoin = invt_id == Investment_history.invt_id  )
